<?php
class Calendar{
    function __construct($user, $passwd, $calendar = ""){
        $this->user = $user;        // User for davical server
        $this->passwd = $passwd;    // User passwd
        $this->payload = "";        // Raw iCal data
        $this->calendar = $calendar;// Calendar URL

        // Default to personal calendar
        if(strlen($calendar) < 1){
            $this->calendar = CONFIG["caldav"];
            // make sure there is a fwd slash
            if(!str_ends_with($this->calendar,"/")){
                $this->calendar .= "/";
            }
            $this->calendar .= $this->user."/calendar/";
        }

        // basic auth
        $credentials = $this->user.":".$this->passwd;
        // to header
        $header = array(
            "Authorization: Basic " . base64_encode($credentials)
        );

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->calendar);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $header);
        curl_setopt($ch, CURLOPT_SSL_VERIFYSTATUS, CONFIG["validate_cert"]);
        $this->payload = curl_exec($ch);
        //echo "<p>".nl2br($output)."</p>";
        //var_dump(curl_getinfo($ch));
        $info = curl_getinfo($ch);
        $this->status = $info["http_code"];
        curl_close($ch);  
        
        // Use the personal calendar to check if authentication was successful.
        if($this->isUserCalendar() && $this->status != 200){
            $msg = "<b>".$this->status."</b>: ";
            switch ($this->status){
                case 401: $msg .= "Authentication failed!"; break;
                case 403: $msg .= "Forbidden!"; break;
                case 404: $msg .= "Calendar <code>\"".$this->calendar."\"</code> not found!"; break;
                default: $msg .= "Unknown error"; break;
            };
            $_SESSION["errmesg"] = $msg;
            header("Location: ./login.php");
            exit();
        }
    }
    function isUserCalendar(){
        return str_ends_with($this->calendar, $_SESSION["user"]."/calendar/");
    }
}
?>