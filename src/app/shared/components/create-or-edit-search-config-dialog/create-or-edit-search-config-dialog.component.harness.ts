import { ComponentHarness, ContentContainerComponentHarness } from '@angular/cdk/testing'

import { InputHarness } from '@onecx/angular-testing'

class CheckboxInputHarness extends ComponentHarness {
  async click(): Promise<void> {
    await (await this.host()).click()
  }

  async isChecked(): Promise<boolean> {
    return await (await this.host()).getProperty<boolean>('checked')
  }
}

class SaveInputValuesCheckboxHarness extends CheckboxInputHarness {
  public static readonly hostSelector = '#saveInputValuesId.p-checkbox-input'
}

class SaveColumnsCheckboxHarness extends CheckboxInputHarness {
  public static readonly hostSelector = '#saveColumnsId.p-checkbox-input'
}

export class CreateOrEditSearchConfigDialogHarness extends ContentContainerComponentHarness {
  public static readonly hostSelector = 'app-ocx-create-or-edit-search-config-dialog'

  getSaveInputValuesCheckboxHarness(): Promise<SaveInputValuesCheckboxHarness> {
    return this.getHarness(SaveInputValuesCheckboxHarness)
  }

  getSaveColumnsCheckboxHarness(): Promise<SaveColumnsCheckboxHarness> {
    return this.getHarness(SaveColumnsCheckboxHarness)
  }

  getSearchConfigInputHarness() {
    return this.getHarness(InputHarness.with({ id: 'searchConfigName' }))
  }

  /** The inline overwrite warning text (an existing name the user may overwrite), or `null` when absent. */
  async getOverwriteWarning(): Promise<string | null> {
    const message = await this.locatorForOptional('.sc-search-config-overwrite-warning')()
    return message ? (await message.text()).trim() : null
  }

  /**
   * The inline "name already exists" message text (an existing name the user may not overwrite, i.e.
   * no `SEARCHCONFIG#EDIT`), or `null` when absent.
   */
  async getNameExistsMessage(): Promise<string | null> {
    const message = await this.locatorForOptional('.sc-search-config-name-exists')()
    return message ? (await message.text()).trim() : null
  }

  async getSaveColumnsLabel(): Promise<string | null | undefined> {
    const labels = await this.locatorForAll('div > label')()
    return labels.at(1)?.text()
  }
}
