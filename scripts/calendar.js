class Calendar{
    static COOKIE_NAME = "calendars";
    static COLOR_COUNT = 8;
    static COUNTER = 0;

    static PARENT = document.getElementById("calendarselection") ?? document.body;
    
    constructor(url, name, user="", passwd="", color = "", hidden = false){
        this.url = url;
        this.name = name;
        this.user = user;
        this.passwd = passwd;
        this.hidden = hidden;
        this.color = color;
        this.id = Calendar.COUNTER++;
        if(this.color.length == 0){
            // Cycle through default colors if none are set
            this.color = (this.id) % Calendar.COLOR_COUNT;
        }

        this.buildDOM();
    }

    setColor(color){
        this.color = color;
        this.colordisplay.style.backgroundColor = this.color;
    }
    /*
        Building DOM for the calendar to select, hide & edit it
    */
    buildDOM(){
        let container = document.createElement("div");
        container.classList.add("calendarselector");
        container.classList.add("d-flex");

        let title = document.createElement("span");
        title.classList.add("title");
        title.innerHTML = this.name;

        this.colordisplay = document.createElement("span");
        this.colordisplay.classList.add("colordisplay");
        this.setColor(this.color);

        container.appendChild(title);
        container.appendChild(this.colordisplay);
        Calendar.PARENT.appendChild(container);
    }

    static fromList(clist){
        console.log(clist.calendars);
        let ret = [];
        if(clist.error != 0){
            console.error(clist.error_message);
            return ret;
        }

        (clist.calendars ?? []).forEach(cal => {
            let obj = new Calendar(cal.url, cal.name);
            obj.setColor(cal.color);
            ret.push(obj);
        });
        return ret;
    }
}

//console.log(Calendar.loadLocal());
console.log(Calendar.fromList(CALENDARLIST));