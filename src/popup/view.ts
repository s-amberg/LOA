import { Utils } from "../utils";
import { Engrave } from "./engraving";

export class View {
    storageName = 'grave';
    engraveAmount = 6;
    engravings: Engrave[] = [];
    warning: string|undefined = undefined;

    warningElement: HTMLElement|null;
    selectedEngraving: Engrave|undefined = undefined;
    engravingsElement: HTMLElement|null;
    addSelectElement: HTMLSelectElement|null;
    engravingSelectElement: HTMLSelectElement|null;

    constructor(private document: Document) {
        this.engravingsElement = document.getElementById('engravings');
        this.engravingSelectElement = document.getElementById('engraving-select') as HTMLSelectElement;
        this.addSelectElement = document.getElementById('add-select') as HTMLSelectElement;
        this.warningElement = document.getElementById('warning');
        this.getStoredEngravings(engravings => {
            this.engravings = engravings ?? [];
            this.render();
            this.bindings();
        })
    }   

    bindings() {
        this.document.getElementById('engravings-button')?.addEventListener('click', (event) => this.engravingsElement?.classList.toggle('active'));
        this.document.getElementById('delete-button')?.addEventListener('click', (event) => this.deleteEngraving());
        this.document.getElementById('replace-button')?.addEventListener('click', (event) => Utils.preventEvent(event, this.replaceEngraving.bind(this)));
        this.document.getElementById('reload-button')?.addEventListener('click', (event) => Utils.preventEvent(event, this.updateEngravingOptions.bind(this)));
        this.document.getElementById('import-button')?.addEventListener('click', (event) => Utils.preventEvent(event, () => this.saveEngraving(this.engravingSelectElement?.value).then(engraving => this.updateSaved())));
        this.engravingsElement?.addEventListener('click', (event) => this.selectEngraving(event));
    }

    render() {
        this.updateSaved();
        this.updateEngravingOptions();
        if(this.addSelectElement) this.addSelectElement.innerHTML = Array.from(Array(this.engraveAmount).keys()).map(key => 
            `<option value=${key}>${key + 1}</option>`).join("\n")
    }

    updateSaved() {
        if(this.engravingsElement) this.engravingsElement.innerHTML = this.engravings.map((engraving, index) => 
            `<li id="${engraving.name}"><span class="bold">${Utils.engravingValue(engraving, index)}</span>${Utils.engravingHead(engraving)}</li>`).join('\n')
    }

    async updateEngravingOptions() {
        if(this.engravingSelectElement) this.engravingSelectElement.innerHTML = await this.getWebsiteEngravings().then(engravings => 

            this.shownEngravings(engravings)?.filter(e => e != null && Utils.nonEmpty(e.name)).map((engraving, index) =>    
            `<option value="${engraving.name}">
                ${Utils.engravingValue(engraving, index)}${Utils.engravingHead(engraving)}
            </option>`).join('\n'))
    }

    async warningOrAction<T>(key: string, action: () => Promise<T>, validation?: () => true|string): Promise<string|T> {
        const isValid = (validation ?? function(){return true}) ();
        if(typeof isValid === "boolean" || this.warning === key) {
            this.warning = undefined;
            this.showWarning(undefined);
            try {
                return await action();
            } catch (e) {
                this.warning = key;
                return (typeof e == "string") ? this.showWarning(e) : Promise.reject(e);
            }
        }
        else {
            this.warning = key;
            this.showWarning(isValid);
            setTimeout(() => {
                this.warning = undefined;
                this.showWarning(undefined);
            }, 5000)
            return Promise.resolve(isValid)
        }
    }

    showWarning(warning: string|undefined): string {
        if(this.warningElement) {
            return this.warningElement.innerHTML = warning ?? '';
        }
        else return ''
    }

    async getWebsiteEngravings(): Promise<Engrave[]> {
        const e = await Utils.sendMessage<{ engravings: Engrave[]; }>({ message: "engravings" }, this.engraveAmount, this.storageName);
        return e.engravings;
    }

    shownEngravings(engravings: Engrave[]) {
        return engravings?.filter(e => e != null && Utils.nonEmpty(e.name)) ?? []
    }
    
    getStoredEngravings(callback: (e: Engrave[]|undefined) => void) {
        return chrome.storage.local.get(this.storageName, (stored) =>
            callback(Utils.parseJSON(stored[this.storageName]))
        )

    }

    selectEngraving(event: Event) {
        this.warningOrAction('select', () => {
            this.document.getElementById(this.selectedEngraving?.name ?? "")?.classList.remove("selected");
            this.selectedEngraving = this.engravings.find(e => e.name === (event.target as HTMLElement)?.id);
            (event.target as HTMLElement)?.classList.add("selected");
            return Promise.resolve(this.selectEngraving)
        })
    }
    
    saveEngravings(callback?: () => void) {
        return chrome.storage.local.set({[this.storageName]: JSON.stringify(this.engravings)}, callback ? () => callback() : undefined)
    }
    
    async saveEngraving(value: string|number|undefined) {
        if(value == null) return
        const engravings = await this.getWebsiteEngravings();
        const toSave = this.shownEngravings(engravings).find(engraving => engraving.name === value.toString());
        if(toSave == null) return

        const maybeExisting = this.engravings.map(e => e.name).indexOf(toSave.name);
        if(maybeExisting === -1) {
            this.engravings.push(toSave)
        }
        else {
            this.engravings[maybeExisting] = toSave;
        }
        return this.saveEngravings()
    }

    deleteEngraving() {
        if(this.selectedEngraving?.name) {
            this.engravings = this.engravings.filter(e => e.name && (e.name !== this.selectedEngraving?.name));
            this.saveEngravings(() => this.updateSaved())
        }
    }

    async replaceEngraving() {
        const toReplaceNr = parseInt(this.addSelectElement?.value ?? '');
        const engravings = await this.getWebsiteEngravings();
    
        const validation = () => {
            const toReplace = engravings[toReplaceNr];
            const maybeExisting = this.engravings.find(e => e.name == toReplace.name);
            return maybeExisting ? true : "selected engraving has not yet been imported, click again to continue"
        }

        const action = () => Utils.sendMessage({message: "replace", engraving: this.selectedEngraving, number: toReplaceNr}, this.engraveAmount, this.storageName).then(e => 
            chrome.tabs.query({active: true, currentWindow: true}).then(tabs => {
                chrome.scripting.executeScript({func: () => window.location.reload(), target: {tabId: tabs[0].id ?? -1}}).then(result =>  {
                    console.info(result);
                })
            }))

        return this.warningOrAction('replace', action, validation)
    }
}