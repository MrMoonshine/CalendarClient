/*
    Helper Widget for day numbers
*/
class ViewAppointmentDay{
    constructor(){
        this.dom = document.createElement("div");
        this.dom.classList.add("view-appointment-day");
        this.number = document.createElement("div");
        this.number.classList.add("number");
        this.month = document.createElement("div");
        this.month.classList.add("month");

        this.set(new Date());

        this.dom.appendChild(this.number);
        this.dom.appendChild(this.month);
    }

    set(date){
        this.date = date;
        let monthname = date.toLocaleString('default', { month: 'long' });
        this.number.innerHTML = date.getDate();
        this.month.innerHTML = monthname.substring(0, 3) + ".";
        // If today, then highlight
        if(sameDay(date, new Date())){
            this.dom.classList.add("active");
        }else{
            this.dom.classList.remove("active");
        }
    }

    // Uset to set onclick to show day
    setCallback(callback){
        this.dom.addEventListener("click", () => {
            callback(this.date);
        });
    }
}

class ViewAppointments extends View{
    constructor(){
        super();
        let dateball1 = new ViewAppointmentDay();
        this.dom.appendChild(dateball1.dom);

        let dateball2 = new ViewAppointmentDay();
        dateball2.set(new Date(2022, 10, 23));
        this.dom.appendChild(dateball2.dom);
    }
}

let appvie = new ViewAppointments();