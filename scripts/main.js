function toggleSideNav(){
    let nav = document.querySelector("nav.side");
    if(nav){
        const hidden = "mobile-hidden";
        if(nav.classList.contains(hidden)){
            nav.classList.remove(hidden);
        }else{
            nav.classList.add(hidden);
        }
    }
}

let userclaendars = Calendar.fromList(CALENDARLIST);
let userview = new View(3, userclaendars);
userview.setRangeRadioName("view");
document.addEventListener('touchstart', View.touchStart, false);
document.addEventListener('touchmove', (evt) => {
    userview.touchMove(evt);
}, false);

const CSS_BASE_NAVIGATOR = "#navigator ";
let navigatorPrev = document.querySelector(CSS_BASE_NAVIGATOR + "#prev");
if(navigatorPrev){
    navigatorPrev.addEventListener("click", () => {
        userview.prev();
    });
}

let navigatorNext = document.querySelector(CSS_BASE_NAVIGATOR + "#next");
if(navigatorNext){
    navigatorNext.addEventListener("click", () => {
        userview.next();
    });
}

console.log(navigatorNext);

let navigatorToday = document.querySelector(CSS_BASE_NAVIGATOR + "#today");
if(navigatorToday){
    navigatorToday.addEventListener("click", () => {
        userview.today();
    });
}

let toggler = document.getElementById("nav-side-toggle");
if(toggler){
    toggler.addEventListener("click", toggleSideNav);
}