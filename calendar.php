<?php
/*
    This page provides an API for getting appointments into JS.

    This page returns a JSON object of iCal appointments.
    However, the iCal data is raw and may be parsed at the client side

    GET/Search Parameters:
    - calendar: calendar to query
    - start: lower bound for appointment search on DAViCal server
    - end: upper bound for appointment search on DAViCal server

    Keep in mind all Search params are hardcoed in (UTC + 0)!!!
    They are formatted in yyyymmddThhmmssZ

    Use those variables in case of errors:
    - error
    - error_message
*/
session_start();
require("config.php");
// https://github.com/wvrzel/simpleCalDAV
require_once("simpleCalDAV/SimpleCalDAVClient.php");

$output = [];
$client = new SimpleCalDAVClient();

//echo("Auth: ".$_SESSION["user"].":".$_SESSION["passwd"]);

// Makes private class vars to json by using the get functions
function caldavObjFactory($obj){
    $ret = array();
    $ret["href"] = $obj->getHref();
    $ret["etag"] = $obj->getEtag();
    $ret["data"] = $obj->getData();
    return $ret;
}

try{
    if(!isset($_GET["calendar"])){
        throw new Exception('mandatory GET variable "calendar" not set!');
    }
    // Session must be opened with user in URL, otherwise, the first user is selected
    $client->connect(
        CONFIG["caldav"].$_SESSION["user"],
        $_SESSION["user"],
        $_SESSION["passwd"]
    );
    // Return object for JS
    $output = [
        "error" => 0,
        "error_message" => "",
        "events" => []
    ];
    $activecal = new CalDAVCalendar($_GET["calendar"], "Test 1");
    $client->setCalendar($activecal);
    // query events
    $appointments = $client->getEvents($_GET["start"], $_GET["end"]);
    //var_dump($appointments);
    foreach ($appointments as $appointment){
        array_push(
            $output["events"],
            caldavObjFactory($appointment)
        );
    }
    unset($appointment);
}catch (CalDAVException $e) {
    //echo("<p>".$e->getResponseHeader()."</p>");
    $output["error"] = -1;
    $rhead = $e->getResponseHeader();
    // 401 and Unauthorized
    if(strstr($rhead, "401") && strstr($rhead, "nauth")){
        $output["error"] = 401;
    }
	//echo $e->__toString();
    $output["error_message"] = $e->__toString();
}catch(Exception $e){
    //echo $e->__toString();
    $output["error"] = 400;
    $output["error_message"] = $e->__toString();
}finally{
    header('Content-type: application/json; charset=utf-8');
    echo json_encode($output);
}
?>