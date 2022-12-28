export function papunika() {

    const popup = document.getElementById("popup")
    if(popup)popup.style.backgroundColor = "red"

    const ads = document.getElementsByTagName("ai-sticky-content")
    for(let i = 0; i < ads.length; i++) {
        const item = ads.item(i)
        if(item != null) {
            item.remove()
        }
    }

    const primary = document.getElementById("primary")
    if(primary != null) {
        primary.style.padding = "0"
    }

    return
}