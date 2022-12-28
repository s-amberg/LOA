import { Engrave } from "./content/engraving";

export class Utils {

    static sendMessage<T>(message: Object): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            try {
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {

                chrome.tabs.sendMessage(tabs[0].id ?? -1,  message, function(response) {
                    resolve(response);
                });
              });
            }
            catch(e) {reject(e)}
            
        })
    }

    static nonEmpty(string: String) {
        return string !== '' && string != null;
    }

    static parseJSON(json: string|undefined|null) {
        try{
            const parsed = JSON.parse(json ?? '{}');
            return Object.keys(parsed).length === 0 ? undefined : parsed
        }
        catch(e){return undefined}
        
    }

    static engravingValue(engraving: Engrave, index: number) {
        return `${Utils.nonEmpty(engraving.name) ? engraving.name : index.toString()}`
    }
    static engravingHead(engraving: Engrave) {
        return `${engraving.head 
            ? `:  ${engraving.head.filter(engraving => Utils.nonEmpty(engraving.value?.toString())).map(head => head.value).join(', ')}`
            : ''}`
    }

    static preventEvent(event: Event, callback: () => void) {
        event.preventDefault();
        event.stopPropagation;
        callback()
    }
}