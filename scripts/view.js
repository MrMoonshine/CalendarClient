const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function sameDay(date1, date2){
    return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
}

class DayTable{
    table;
    static MS_DAY = 60 * 60 * 24 * 1000;
    constructor(days, start = null){
        this.dayCount = days;
        this.days = [];         // This is an array of dates, used to set days
        // Correct start date, in case of week or month view
        this.start = this.getStartDate(start ?? new Date());
        this.table = document.createElement("table");
        this.thead = document.createElement("thead");
        this.tbody = document.createElement("tbody");
        this.table.appendChild(this.thead);
        this.table.appendChild(this.tbody);
        this.setDays(this.dayCount);
    }

    setDays(days){
        this.dayCount = days;
        this.clear();
        let trh = document.createElement("tr");
        this.thead.appendChild(trh);
        // include an empty one for the clock on the left side
        trh.appendChild(document.createElement("th"));
        for(let i = 0; i < this.dayCount; i++){
            let th = document.createElement("th");
            let date = new Date(this.start.getTime() + DayTable.MS_DAY * i);
            // format date
            th.innerHTML = date.toLocaleString('default', {weekday: "short", day:"numeric", month: 'short'});
            trh.appendChild(th);
        }
        // A row for each hour of the day
        for(let i = 0; i < 24; i++){
            let date = new Date();
            date.setMinutes(0);
            date.setHours(i);

            let dateth = document.createElement("th");
            dateth.innerHTML = date.toLocaleString('default', {hour: "2-digit", minute: "2-digit", hour12: false});

            let tr = document.createElement("tr");
            tr.appendChild(dateth);
            for(let i = 0; i < this.dayCount; i++){
                tr.appendChild(document.createElement("td"));
            }            
            this.tbody.appendChild(tr);
        }
    }

    clear(){
        this.days = [];
        this.thead.innerHTML = "";
        this.tbody.innerHTML = "";
    }

    get dom(){
        return this.table;
    }

    /*
        @brief Helper function to get the first day for a calendar period
        @param [day] Starting day.
        @return in case of 3 days, the first. In case of 7 the first of the week
    */
    getStartDate(date){
        const MONDAY = 1;
        switch(this.dayCount){
            case 7: {
                let diff = MONDAY - date.getDay();
                // add/substract a day in ms
                return new Date(date.getTime() + DayTable.MS_DAY * diff);
            } break;
            default: {
                return date;
            }break;
        }
    }
}

class View{
    static PARENT = document.getElementById("calendarspace") ?? document.body;
    static xDown = null;
    static yDown = null;
    constructor(days = 3){
        this.start = new Date();
        this.end = new Date();
        
        this.dom = document.createElement("div");
        View.PARENT.appendChild(this.dom);

        this.table = new DayTable(days);
        //this.dom.append();
        this.dom.append(this.table.dom);

        View.xDown = null;
        View.yDown = null;
    }
    /*
        Set the number of days displayed. e.g 1 day, 3 days or 7 for the week. Start will be picked automatically
    */
    setDays(days){
        this.days = days;
        this.table.setDays(this.days);
    }

    static getTouches(evt) {
        return evt.touches ||      // browser API
        evt.originalEvent.touches; // jQuery
    }   

    static touchStart(evt){
        const firstTouch = View.getTouches(evt)[0];                                      
        View.xDown = firstTouch.clientX;                                      
        View.yDown = firstTouch.clientY;
        //console.log(View.xDown + " - " + View.yDown);
    }

    static touchMove(evt){
        if ( ! View.xDown || ! View.yDown ) {
            return;
        }
    
        var xUp = evt.touches[0].clientX;                                    
        var yUp = evt.touches[0].clientY;
    
        var xDiff = View.xDown - xUp;
        var yDiff = View.yDown - yUp;
                                                      
        /*most significant*/
        if ( Math.abs( xDiff ) > Math.abs( yDiff ) ) {
            if ( xDiff > 0 ) {
                /* right swipe */
                console.log("Swipe Right to Left!");
                View.PARENT.innerHTML += "Swipe Right to Left!<br>";
            } else {
                /* left swipe */
                console.log("Swipe Left!");
                View.PARENT.innerHTML += "Swipe Left to Right!<br>";
            }                       
        } else {
            if ( yDiff > 0 ) {
                /* down swipe */ 
                console.log("Swipe Down to Up!");
            } else { 
                /* up swipe */
                console.log("Swipe Up to Down!");
            }                                                                 
        }
        /* reset values */
        View.xDown = null;
        View.yDown = null; 
    }
}
document.addEventListener('touchstart', View.touchStart, false);
document.addEventListener('touchmove', View.touchMove, false);

let v1 = new View(3);