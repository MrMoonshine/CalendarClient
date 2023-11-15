<?php
define(
    "CONFIG",
    array(
        /*---------------------------------+
        |        Server                    |
        +---------------------------------*/
        // URL to caldav script
        "caldav" => "http://alpaka3d/davical/caldav.php/",      
        // SSL cert validation enable/disable
        "validate_cert" => false,
        /*
            - Aditional calendars that will be subscribed by all users by default
            - Personal calendar is going to be subscribed to. Regardless of what is set here
            - 
        */
        "subscribe_default" => array(
            /* e.g
                array(
                    "name" => "Holidays"
                    "url" => "https://myserver/davicas/caldav.php/path/to/my/calendar/"
                ),
                array(
                    "name" => "Birthdays"
                    "url" => "/user/birthdays/"  // Will default to configured server
                ),
            */
            array(
                "name" => "Schichtplan",
                "url" => "/david/schichtplan/"
            )
        ),
        /*---------------------------------+
        |        Cosmetics                 |
        +---------------------------------*/
        "color_default" => "#008080",
        "background" => "",                                     // Background image for login Form                                          
    )
);
?>