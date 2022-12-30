import { Utils } from "../utils"
  
function storageName(storageName: string, id: number|string) {
    const intId = parseInt(id.toString()) + 1
    const adjustedID = intId === 1 ? '' : intId.toString();
    return storageName + adjustedID
}
  
chrome.runtime.onMessage.addListener( (request, sender, sendResponse) => {
    if(request.message === "engravings") {
        
        const engravings = Array.from(Array(request.engraveAmount).keys())
            .map(id => Utils.parseJSON(localStorage.getItem(storageName(request.storageName, id)))) ?? []
        sendResponse({engravings, status: "success"})
    }
    else if(request.message === "replace" && request.engraving != null) {

        localStorage.setItem(storageName(request.storageName, request.number), JSON.stringify(request.engraving));
        sendResponse({status: "success"})
    }
    else sendResponse({document, localStorage})
})