# onecx-search-config-ui

OneCX Search Config Ui

## Saved searches

A search config is a named set of search criteria (field values and view mode), displayed columns, or
both, saved for one page. The app exposes two remotes, each with one config select and a joined
**Save As** button:

| Remote | Tag | Lists |
| --- | --- | --- |
| Search header | `ocx-search-config-component` | Saved configs that store criteria. Label "Search Config"; with no configs the label reads "No search configs" and the select is disabled (Save As stays available). |
| Column selector | `ocx-column-group-selection-component` | Two groups: **Predefined** (the host's column groups, never deletable) and **Saved** (configs that store columns). Shows the host placeholder until something is selected, then "Column group". |

Both dropdowns have a name filter ("Filter by name", "No matching configs"). Long names are cut off
with an ellipsis and show the full name in a tooltip. Configs are fetched once per page when the
remote mounts; nothing is applied automatically.

**Selecting.** Picking a config applies everything it stores and shows its name in every select that
lists it. The two remotes stay in sync through the shared `SearchConfigTopic`, so both slots must be on
the same page. The header emits `searchConfigSelected` (criteria, columns, view mode), and the column
selector emits `groupSelectionChanged`. A predefined group applies columns only and leaves the header
untouched. With only the column selector on the page, a config applies as columns only.

**Modified `*`.** A selected config stays selected when the page changes. If an aspect it stores
(criteria or columns) no longer matches the page, every select showing it renders `Name*` with a
"Modified" tooltip. Restoring the values clears the marker. Switching to another config applies it
immediately, without a discard prompt.

**Save As.** The dialog ("Save search config") has a name field that suggests the page's existing
non-read-only configs, and two checkboxes: "Save search criteria" and "Save columns". The header
pre-checks criteria, and the column selector pre-checks columns. Save is enabled when the name is
non-blank and at least one box is checked.

- **New name:** creates a config with the checked aspects.
- **Existing name** (trimmed, case-insensitive): an inline warning names what will be overwritten.
  Confirming fully replaces the stored config with the checked aspects, so the config can drop out of
  one of the two dropdowns.
- **Locked "Save columns":** when Save As is opened from the header and the column selector is absent
  or the layout is not `table`, the box is disabled and unchecked, with an explanation. An overwrite
  then replaces only the criteria and keeps the stored columns.
- **Empty search:** "Save search criteria" also saves empty fields. Every field the host reports is
  stored, empty ones as `""`, so the config is listed in the header and selecting it clears the fields.
  Empty fields are ignored when deciding whether a config is modified. The host only reports its fields
  once its search form has changed, so an untouched form saves no criteria.

After saving, the config is selected in every select that lists it (the header lists configs that
store criteria, the column selector configs that store columns; the other select keeps its selection),
and a toast confirms "saved" or "overwritten".

**Delete.** Deletable rows show a trash button. Pressing Delete on a highlighted option in the open
list does the same. A confirm dialog ("Delete search config?") warns that this cannot be undone; there
is no undo, and a toast confirms the delete. Deleting the selected config resets the affected selects
to their placeholder. The page's current values and columns are kept.

### Permissions

Both remotes render only with `SEARCHCONFIG#VIEW`.

| Permission | Enables |
| --- | --- |
| `SEARCHCONFIG#VIEW` | Both remotes: list and select configs. |
| `SEARCHCONFIG#CREATE` | Save As with a new name. With `CREATE` but not `EDIT`, the name field suggests nothing, and an existing name shows "already exists" and blocks Save. |
| `SEARCHCONFIG#EDIT` | Overwrite an existing non-read-only config through Save As. With `EDIT` but not `CREATE`, Save is enabled only for an existing name. |
| `SEARCHCONFIG#DELETE` | The trash button and the Delete key, never on read-only configs or predefined groups. |

Save As is shown with `CREATE` or `EDIT`. Without either, the button is hidden and the select has
fully rounded corners. The keys are declared in `helm/values.yaml`. `EDIT` means overwrite; there is no
separate edit or rename.

**Storage scope:** the backend stores configs per tenant, not per user. All users of a tenant share a
page's configs, so anyone with `EDIT` or `DELETE` can overwrite or delete any of them (see
onecx/internal-tasks#1283).

## Search-config styling

The global stylesheet (`src/styles.scss`) owns the `--onecx-search-config-*` design tokens and both
remotes' custom styles (the search header and the column-group selector).

**Rule: PrimeNG tokens or `--onecx-search-config-*` only.** Every custom value must
be a PrimeNG design token (a `--p-*` variable) or one of the `--onecx-search-config-*` variables defined
in the `:root` block in `src/styles.scss`. Hard-coded colors or sizes are not allowed. Custom styles
are scoped to the remote's host element (`ocx-search-config-component` / `ocx-column-group-selection-component`)
or to stable `styleClass` / `panelStyleClass` hooks and fixed button ids — never `::ng-deep`, never
unscoped global selectors. Remotes inherit the host theme and set no theme of their own.

All remote-owned custom styles live in `src/styles.scss`, including the layout of the portaled
dialogs. Component stylesheets are not used: the shell rewrites the `--p-*` tokens to the remote's
token prefix only in `styles.css`, so a `--p-*` token in a component stylesheet would resolve to
nothing.

**Host roots inside the shell's `@scope`.** The shell wraps `styles.css` in
`@scope([data-style-id=…]) to ([data-style-isolation])`, and the remote's host element *is* that scope
root. A selector without `:scope` is implicitly a descendant of the scope root, so a plain
`ocx-search-config-component .x` never matches. Host-rooted rules therefore use
`ocx-search-config-component:is(:scope, *) .x` (in `styles.scss` via the `$sc-hosts` /
`$sc-column-host` variables), which matches the host as the scope root inside the shell and keeps the
plain descendant meaning when the remote runs standalone. The dialogs are portaled into a wrapper that
is its own scope root, so their rules are rooted at `app-ocx-create-or-edit-search-config-dialog` and at
fixed button ids.

### `--onecx-search-config-*` variables

| Variable | Purpose | Value |
| --- | --- | --- |
| `--onecx-search-config-width` | Minimum width of each remote's input group (config select + joined Save As button); the group grows when a translated Save As label needs more room. Also the maximum width of the option panel, so long names are cut off with an ellipsis. | `18rem` (app-owned; PrimeNG has no width token for the input group) |
| `--onecx-search-config-select-width` | Width of the select part of the input group, so its float label stays readable next to a long Save As label. | `13rem` (app-owned) |
| `--onecx-search-config-height` | Height of the config select control and the joined Save As button. | `auto` (the natural PrimeNG form-field height, so the group lines up with the host's inputs and buttons) |
| `--onecx-search-config-radius` | Outer corner radius of the input group (select and joined Save As), applied via `--p-inputgroup-addon-border-radius`. | `var(--p-select-border-radius)` |
| `--onecx-search-config-border-color` | Border color of the config select control — **reserved for a later ticket**: no selector reads it yet, so it is not applied. | `var(--p-select-border-color)` |
| `--onecx-search-config-panel-max-height` | Maximum height of the opened option list before it scrolls (the select's `scrollHeight`). | `16rem` (app-owned layout cap) |
| `--onecx-search-config-delete-color` | Color of the per-row delete (trash) icon. | `var(--p-button-danger-background)` (PrimeNG danger/red) |
| `--onecx-search-config-delete-hover-background` | Light-red background behind the trash icon on hover. | `var(--p-button-text-danger-hover-background)` |
| `--onecx-search-config-modified-marker-color` | Color of the `*` marker next to a modified config's name (option row and collapsed label). | `var(--p-button-text-warn-color)` |
| `--onecx-search-config-group-header-color` | Color of the "Predefined" / "Saved" group headers (column selector only). | `var(--p-select-option-group-color)` |
| `--onecx-search-config-dialog-width` | Width of the delete-confirm and Save As dialogs in both remotes (applied via `PortalDialogConfig.width`). | `30rem` (app-owned) |

The per-row delete (trash) icon is the PrimeNG `text` + `danger` severity button; its red colour and
light-red hover background are sourced from `--onecx-search-config-delete-color` and
`--onecx-search-config-delete-hover-background`, which drive the button through scoped
`--p-button-text-danger-*` token overrides on the trash hook. Both the delete-confirm and the Save As
dialogs are portaled outside the remote element; each carries the remote's `data-style-id`, so the
host's scoped styling reaches it. The delete-confirm dialog's Delete button has a fixed id
(`ocx-search-config-delete-button`) as the stable test and style anchor; its red look comes from
`severity: 'danger'`, i.e. the `--p-button-danger-*` tokens. Both dialogs show the close (X) button, and
their Cancel button has the fixed id `ocx-search-config-dialog-cancel-button`, which gives it the
outlined look through the `--p-button-outlined-primary-*` tokens. The Save As dialog's autocomplete
suggestions panel targets the `sc-search-config-save-as-panel` style hook via `panelStyleClass`. The
Save As dialog's overwrite warning (shown when the typed name already exists and the user may
overwrite it, i.e. has `SEARCHCONFIG#EDIT`) is a PrimeNG `p-message` with the stable anchor class
`sc-search-config-overwrite-warning`, carried as the element's `class` so tests and styles can target
it directly. Without `SEARCHCONFIG#EDIT` an existing name shows the "name already exists" `p-message`
instead, with the stable anchor class `sc-search-config-name-exists`.

## Host translations

Some texts are passed in by the host as its own i18n keys, e.g. the predefined column group keys
(`TENANT_SEARCH.PREDEFINED_GROUP.DEFAULT`) and the column selector's placeholder. Besides its own
`assets/i18n/` the remote therefore also loads the translations of the host MFE that embeds it
(`<currentMfe.remoteBaseUrl>assets/i18n/`, see `src/app/shared/host-translation-path.ts`). The remote's
own translations are merged last, so they win when a key exists in both. When no current MFE is
published (standalone), only the remote's own translations are loaded.
