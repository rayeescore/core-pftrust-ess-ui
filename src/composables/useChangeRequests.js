/**
 * Reading back a correction the member has already asked for.
 *
 * **Every word of substance here is the server's.** `item.label` comes from `ChangeRequestField`,
 * `status.label` and `status.tone` from `MemberChangeStatus`, and `pending` from the entity itself.
 * What this file adds is only the joining and the two words for an absent value -- the part the
 * profile card and the history list would otherwise each spell for themselves. They showed the same
 * request through two copies of the same join before this existed, which is one edit away from two
 * screens describing one request differently.
 *
 * Nothing here decides anything a handler would have to agree with. `pending` in particular is read,
 * never inferred from the label: it is what `MemberChangeRequests.withdraw` will actually accept, so
 * the Withdraw button appears on exactly the requests the API would take it for rather than on the
 * ones whose wording sounds open.
 */

/** "Mobile number", or "Nominee · Rohan Deshmukh" -- a nomination changes one named person's share. */
export function title(item) {
  return item.subject ? `${item.label} · ${item.subject}` : item.label
}

/**
 * The one line that stands for the whole request in a list.
 *
 * `MemberChangeRequestRecord` filters its items to the active ones, so a request can arrive carrying
 * none. An empty line would read as a broken row, so it falls back to something a member can still
 * click on rather than to nothing.
 */
export function summary(request) {
  const items = request?.items ?? []

  return items.length ? items.map(title).join(', ') : 'A correction'
}

/**
 * One before-and-after pair, in words.
 *
 * **Null is not empty, and the API keeps the difference on purpose** -- `MemberChangeRequestRecord`
 * passes null through rather than collapsing it to a dash, because "not on record" and "blank" are
 * different facts. Both ends are given the words the correction form's own diff already uses, so a
 * member meets one phrase for a missing value and not two.
 *
 * The removal case is the one a row that simply printed the value would get wrong: taking a nominee
 * off is sent as a requested value of null, and an empty space is not what a member asked for.
 */
export function changeOf(item) {
  return {
    from: item.currentValue ?? 'Not on record',
    to: item.requestedValue ?? 'Removed',
    added: item.currentValue == null,
    removed: item.requestedValue == null,
  }
}

/** Still open against already answered, holding the order given -- which the API sends newest first. */
export function partition(requests) {
  const all = requests ?? []

  return {
    pending: all.filter((request) => request.pending),
    decided: all.filter((request) => !request.pending),
  }
}
