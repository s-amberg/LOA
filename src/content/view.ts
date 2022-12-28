import { Utils } from "../utils";
import { Engrave } from "./engraving";

export class View {
    storageName = 'grave';
    engraveAmount = 6;
    engravings: Engrave[] = [];
    selectedEngraving: Engrave|undefined = undefined;
    engravingsElement: HTMLElement|null;
    addSelectElement: HTMLSelectElement|null;
    engravingSelectElement: HTMLSelectElement|null;

    constructor(private document: Document) {
        this.engravingsElement = document.getElementById('engravings');
        this.engravingSelectElement = document.getElementById('engraving-select') as HTMLSelectElement;
        this.addSelectElement = document.getElementById('add-select') as HTMLSelectElement;
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
            engravings.map((engraving, index) =>    
            `<option value="${engraving.name}">
                ${Utils.engravingValue(engraving, index)}${Utils.engravingHead(engraving)}
            </option>`).join('\n'))
    }

    getWebsiteEngravings(): Promise<Engrave[]> {
        return Utils.sendMessage<Engrave[]>({message: "engravings", engraveAmount: this.engraveAmount, storageName: this.storageName})
    }
    
    getStoredEngravings(callback: (e: Engrave[]|undefined) => void) {
        return chrome.storage.local.get(this.storageName, (stored) =>
            callback(Utils.parseJSON(stored[this.storageName]))
        )

    }

    selectEngraving(event: Event) {
        this.document.getElementById(this.selectedEngraving?.name ?? "")?.classList.remove("selected");
        this.selectedEngraving = this.engravings.find(e => e.name === (event.target as HTMLElement)?.id);
        (event.target as HTMLElement)?.classList.add("selected");
    }
    
    saveEngravings(callback?: () => void) {
        return chrome.storage.local.set({[this.storageName]: JSON.stringify(this.engravings)}, callback ? () => callback() : undefined)
    }
    
    async saveEngraving(value: string|number|undefined) {
        if(value == null) return
        const engravings = await this.getWebsiteEngravings()
        const toSave = engravings.find(engraving => engraving.name === value.toString());
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

    replaceEngraving() {
        const toReplaceNr = this.addSelectElement?.value
        Utils.sendMessage({message: "replace", engraving: this.selectedEngraving, number: toReplaceNr, storageName: this.storageName}).then(e => 
            
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                var code = 'window.location.reload();';
                chrome.tabs.executeScript(tabs[0].id ?? -1,  {code: code});
            })
    )}
}