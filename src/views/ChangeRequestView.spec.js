import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

/**
 * The correction form, mounted.
 *
 * What is pinned is where proof is asked for and how much of it: a request carries one file, so each
 * section that needs a document asks for its own under itself, and a nominee change and a bank change
 * leave as two requests with one document each. One nomination form covers every nominee in it.
 */

const profile = {
  mobile: '98765 43210',
  alternateMobile: null,
  email: 'rohan@example.com',
  alternateEmail: null,
  bank: { name: 'HDFC Bank', branch: 'Kandivali', account: 'XXXXXXXX1234', codes: 'HDFC0001234 · MICR 400240001' },
  nominees: [{ name: 'Aarti Deshmukh', relationship: 'Mother', share: 100 }],
}

const push = vi.fn()

vi.mock('vue-router', () => ({ useRouter: () => ({ push }), RouterLink: { template: '<a><slot /></a>' } }))

vi.mock('@/api/me', () => ({
  getProfile: vi.fn(async () => structuredClone(profile)),
  createChangeRequest: vi.fn(async () => ({ id: 'r1' })),
}))

const me = await import('@/api/me')
const View = (await import('@/views/ChangeRequestView.vue')).default

const stubs = { RouterLink: { template: '<a><slot /></a>' }, AppIcon: true }
const nominationForm = new File(['form'], 'form2.pdf', { type: 'application/pdf' })
const cheque = new File(['cheque'], 'cheque.jpg', { type: 'image/jpeg' })

async function mounted() {
  const wrapper = mount(View, { global: { stubs } })
  await flushPromises()
  return wrapper
}

const button = (wrapper, text) => wrapper.findAll('button').find((each) => each.text() === text)

/** Adds Priya at the share given and moves Aarti to what remains. */
async function addPriya(wrapper, share = '40', aarti = '60') {
  await button(wrapper, 'Add a nominee').trigger('click')
  const row = wrapper.findAll('fieldset')[0]
  const inputs = row.findAll('input')
  // Aarti's share box, then the three new-nominee boxes.
  await inputs[0].setValue(aarti)
  await inputs[1].setValue('Priya Deshmukh')
  await inputs[2].setValue('Daughter')
  await inputs[3].setValue(share)
  await button(wrapper, 'Add').trigger('click')
}

async function attach(fieldset, file) {
  const input = fieldset.find('input[type="file"]')
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
  await input.trigger('change')
}

describe('ChangeRequestView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('asks for the nomination form under the nominees, and nowhere else', async () => {
    const wrapper = await mounted()
    expect(wrapper.text()).not.toContain('Proof for this change')

    await addPriya(wrapper)

    const [nomineeSection, bankSection] = wrapper.findAll('fieldset')
    expect(nomineeSection.text()).toContain('a signed nomination form')
    expect(bankSection.text()).not.toContain('Proof for this change')
  })

  it('sends several nominees on one request with one document', async () => {
    const wrapper = await mounted()
    await addPriya(wrapper)
    await attach(wrapper.findAll('fieldset')[0], nominationForm)

    await button(wrapper, 'Send the request').trigger('click')
    await flushPromises()

    expect(me.createChangeRequest).toHaveBeenCalledTimes(1)
    const [request, file] = me.createChangeRequest.mock.calls[0]
    expect(request.items.map((item) => item.subject)).toEqual(['Aarti Deshmukh', 'Priya Deshmukh (Daughter)'])
    expect(file).toBe(nominationForm)
    expect(push).toHaveBeenCalledWith('/profile')
  })

  it('sends a nominee change and a bank change as two requests, each with its own document', async () => {
    const wrapper = await mounted()
    await addPriya(wrapper)
    await wrapper.find('input[inputmode="tel"]').setValue('99887 76655')

    const bankSection = wrapper.findAll('fieldset')[1]
    await bankSection.findAll('input')[3].setValue('ICIC0004321')
    expect(bankSection.text()).toContain('a cancelled cheque')

    await attach(wrapper.findAll('fieldset')[0], nominationForm)
    await attach(bankSection, cheque)
    await button(wrapper, 'Send the request').trigger('click')
    await flushPromises()

    expect(me.createChangeRequest).toHaveBeenCalledTimes(2)

    const [[nomineeRequest, first], [bankRequest, second]] = me.createChangeRequest.mock.calls
    // The mobile needs no proof and rides with the first request rather than becoming a third.
    expect(nomineeRequest.items.map((item) => item.field)).toEqual(['MOBILE', 'NOMINEE', 'NOMINEE'])
    expect(first).toBe(nominationForm)
    expect(bankRequest.items.map((item) => item.field)).toEqual(['BANK_IFSC'])
    expect(second).toBe(cheque)
  })

  it('refuses to add a nominee the fund has no room for, and says so under the nominees', async () => {
    const wrapper = await mounted()
    // Aarti still holds 100%, which is the state in the screenshot that prompted this.
    await addPriya(wrapper, '50', '100')

    const nomineeSection = wrapper.findAll('fieldset')[0]
    expect(nomineeSection.text()).toContain('The whole 100% is already assigned')
    expect(nomineeSection.text()).not.toContain('Priya Deshmukh · Daughter')
    expect(me.createChangeRequest).not.toHaveBeenCalled()
  })

  it('offers only what is unassigned', async () => {
    const wrapper = await mounted()
    await addPriya(wrapper, '50', '60')

    expect(wrapper.findAll('fieldset')[0].text()).toContain('Only 40% is unassigned')
  })

  it('flags a share edited past 100% in the section and holds the send', async () => {
    const wrapper = await mounted()
    await addPriya(wrapper)
    await attach(wrapper.findAll('fieldset')[0], nominationForm)

    // Aarti back up to 100 beside Priya's 40.
    await wrapper.findAll('fieldset')[0].findAll('input')[0].setValue('100')

    const nomineeSection = wrapper.findAll('fieldset')[0]
    expect(nomineeSection.find('[role="alert"]').text()).toContain('The shares add up to 140%')
    expect(nomineeSection.text()).toContain('40% over')
    expect(nomineeSection.find('input[aria-invalid="true"]').exists()).toBe(true)
    expect(button(wrapper, 'Send the request').attributes('disabled')).toBeDefined()
  })

  it('flags a share that is not a number from 0 to 100', async () => {
    const wrapper = await mounted()
    await wrapper.findAll('fieldset')[0].findAll('input')[0].setValue('abc')

    expect(wrapper.findAll('fieldset')[0].find('[role="alert"]').text()).toBe('Each share is a number from 0 to 100.')
  })

  it('refuses a new nominee with a share of 0 or over 100', async () => {
    const wrapper = await mounted()
    await addPriya(wrapper, '0', '60')

    expect(wrapper.findAll('fieldset')[0].text()).toContain('A share is a number above 0 and at most 100.')
  })

  it('after a half-failed send, says what went and retries only the rest', async () => {
    me.createChangeRequest
      .mockResolvedValueOnce({ id: 'r1' })
      .mockRejectedValueOnce({ response: { data: { message: 'That file is not a page.' } } })

    const wrapper = await mounted()
    await addPriya(wrapper)
    const bankSection = wrapper.findAll('fieldset')[1]
    await bankSection.findAll('input')[3].setValue('ICIC0004321')
    await attach(wrapper.findAll('fieldset')[0], nominationForm)
    await attach(bankSection, cheque)

    await button(wrapper, 'Send the request').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Your nominee change was sent. The rest was not: That file is not a page.')
    expect(wrapper.findAll('fieldset')[0].attributes('disabled')).toBeDefined()
    expect(push).not.toHaveBeenCalled()

    await button(wrapper, 'Send the request').trigger('click')
    await flushPromises()

    expect(me.createChangeRequest).toHaveBeenCalledTimes(3)
    expect(me.createChangeRequest.mock.calls[2][0].items.map((item) => item.field)).toEqual(['BANK_IFSC'])
    expect(push).toHaveBeenCalledWith('/profile')
  })
})
