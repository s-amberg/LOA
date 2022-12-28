import { Utils } from "../utils"

function main() {
    const hostname = document.location.hostname ?? ""

    switch (true) {
        case  hostname.includes("loa-todo.com/engrave") : console.log("engraving site")
    }
}
  
function storageName(storageName: string, id: number|string) {
    const intId = parseInt(id.toString()) + 1
    const adjustedID = intId === 1 ? '' : intId.toString();
    return storageName + adjustedID
}
  
chrome.runtime.onMessage.addListener( (request, sender, sendResponse) => {
    if(request.message === "engravings") {
        
        const engravings = Array.from(Array(request.engraveAmount).keys())
            .map(id => Utils.parseJSON(localStorage.getItem(storageName(request.storageName, id))))
            .filter(e => e != null && Utils.nonEmpty(e.name)) ?? []
        sendResponse(engravings)
    }
    else if(request.message === "replace" && request.engraving != null) {
        localStorage.setItem(storageName(request.storageName, request.number), JSON.stringify(request.engraving));
        sendResponse("success")
    }
    else sendResponse({document, localStorage})
})