
var debug = true; // set this to false to turn debugging off

var output = window.console; // output can be set to any object that has a log(string) function
// such as: var output = { log: function(str){alert(str);} };

// Define exception/error codes
var _NoError = { "code": "0", "string": "No Error", "diagnostic": "No Error" };;
var _GeneralException = { "code": "101", "string": "General Exception", "diagnostic": "General Exception" };
var _AlreadyInitialized = { "code": "103", "string": "Already Initialized", "diagnostic": "Already Initialized" };

var initialized = false;

// local variable definitions
var apiHandle = null;

function doInitialize() {
    if (initialized) return "true";

    var api = getAPIHandle();
    if (api == null) {
        message("Unable to locate the LMS's API Implementation.\nInitialize was not successful.");
        return "false";
    }
	var data = api.cmi.toJSON();
    if (data.suspend_data !== "") {
        glhp.DataLocal.Slide = JSON.parse(data.suspend_data);   
    }
    var result = api.Initialize("");

    if (result.toString() != "true") {
        var err = ErrorHandler();
		if(err.code == 103)
		{
			initialized = true;
			return "true";
		}
        message("Initialize failed with error code: " + err.code);
    } else {
        initialized = true;
    }

    return result.toString();
}
function doTerminate() {
    if (!initialized) return "true";

    var api = getAPIHandle();
    if (api == null) {
        message("Unable to locate the LMS's API Implementation.\nTerminate was not successful.");
        return "false";
    } else {
        // call the Terminate function that should be implemented by the API
        var result = api.Terminate("");
        if (result.toString() != "true") {
            var err = ErrorHandler();
            message("Terminate failed with error code: " + err.code);
        }
    }

    initialized = false;

    return result.toString();
}
function doGetValue(name) {
    var api = getAPIHandle();
    var result = "";
    if (api == null) {
        message("Unable to locate the LMS's API Implementation.\nGetValue was not successful.");
    } else if (!initialized && !doInitialize()) {
        var err = ErrorHandler();
        message("GetValue failed - Could not initialize communication with the LMS - error code: " + err.code);
    } else {
        result = api.GetValue(name);

        var error = ErrorHandler();
        if (error.code != _NoError.code) {
            // an error was encountered so display the error description
            message("GetValue(" + name + ") failed. \n" + error.code + ": " + error.string);
            result = "";
        }
    }
    return result.toString();
}

/*******************************************************************************
 **
 ** Function doSetValue(name, value)
 ** Inputs:  name -string representing the data model defined category or element
 **          value -the value that the named element or category will be assigned
 ** Return:  true if successful
 **          false if failed.
 **
 ** Description:
 ** Wraps the call to the SetValue function
 **
 *******************************************************************************/
function doSetValue(name, value) {
    var api = getAPIHandle();
    var result = "false";
    if (api == null) {
        message("Unable to locate the LMS's API Implementation.\nSetValue was not successful.");
    } else if (!initialized && !doInitialize()) {
        var error = ErrorHandler();
        message("SetValue failed - Could not initialize communication with the LMS - error code: " + error.code);
    } else {
        result = api.SetValue(name, value);
        if (result.toString() != "true") {
            var err = ErrorHandler();
            message("SetValue(" + name + ", " + value + ") failed. \n" + err.code + ": " + err.string);
        }
    }

    return result.toString();
}
/*******************************************************************************
 **
 ** Function doCommit()
 ** Inputs:  None
 ** Return:  true if successful
 **          false if failed
 **
 ** Description:
 ** Commits the data to the LMS. 
 **
 *******************************************************************************/
function doCommit() {
    var api = getAPIHandle();
    var result = "false";
    if (api == null) {
        message("Unable to locate the LMS's API Implementation.\nCommit was not successful.");
    } else if (!initialized && !doInitialize()) {
        var error = ErrorHandler();
        message("Commit failed - Could not initialize communication with the LMS - error code: " + error.code);
    } else {
        result = api.Commit("");
        if (result != "true") {
            var err = ErrorHandler();
            message("Commit failed - error code: " + err.code);
        }
    }

    return result.toString();
}

/*******************************************************************************
 **
 ** Function doGetLastError()
 ** Inputs:  None
 ** Return:  The error code that was set by the last LMS function call
 **
 ** Description:
 ** Call the GetLastError function 
 **
 *******************************************************************************/
function doGetLastError() {
    var api = getAPIHandle();
    if (api == null) {
        message("Unable to locate the LMS's API Implementation.\nGetLastError was not successful.");
        //since we can't get the error code from the LMS, return a general error
        return _GeneralException.code;
    }

    return api.GetLastError().toString();
}

/*******************************************************************************
 **
 ** Function doGetErrorString(errorCode)
 ** Inputs:  errorCode - Error Code
 ** Return:  The textual description that corresponds to the input error code
 **
 ** Description:
 ** Call the GetErrorString function 
 **
 ********************************************************************************/
function doGetErrorString(errorCode) {
    var api = getAPIHandle();
    if (api == null) {
        message("Unable to locate the LMS's API Implementation.\nGetErrorString was not successful.");
        return _GeneralException.string;
    }

    return api.GetErrorString(errorCode).toString();
}

/*******************************************************************************
 **
 ** Function doGetDiagnostic(errorCode)
 ** Inputs:  errorCode - Error Code(integer format), or null
 ** Return:  The vendor specific textual description that corresponds to the 
 **          input error code
 **
 ** Description:
 ** Call the LMSGetDiagnostic function
 **
 *******************************************************************************/
function doGetDiagnostic(errorCode) {
    var api = getAPIHandle();
    if (api == null) {
        message("Unable to locate the LMS's API Implementation.\nGetDiagnostic was not successful.");
        return "Unable to locate the LMS's API Implementation. GetDiagnostic was not successful.";
    }

    return api.GetDiagnostic(errorCode).toString();
}

/*******************************************************************************
 **
 ** Function ErrorHandler()
 ** Inputs:  None
 ** Return:  The current error
 **
 ** Description:
 ** Determines if an error was encountered by the previous API call
 ** and if so, returns the error.
 **
 ** Usage:
 ** var last_error = ErrorHandler();
 ** if (last_error.code != _NoError.code)
 ** {
 **    message("Encountered an error. Code: " + last_error.code + 
 **                                "\nMessage: " + last_error.string +
 **                                "\nDiagnostics: " + last_error.diagnostic);
 ** }
 *******************************************************************************/
function ErrorHandler() {
    var error = { "code": _NoError.code, "string": _NoError.string, "diagnostic": _NoError.diagnostic };
    var api = getAPIHandle();
    if (api == null) {
        message("Unable to locate the LMS's API Implementation.\nCannot determine LMS error code.");
        error.code = _GeneralException.code;
        error.string = _GeneralException.string;
        error.diagnostic = "Unable to locate the LMS's API Implementation. Cannot determine LMS error code.";
        return error;
    }

    // check for errors caused by or from the LMS
    error.code = api.GetLastError().toString();
    if (error.code != _NoError.code) {
        // an error was encountered so display the error description
        error.string = api.GetErrorString(error.code);
        error.diagnostic = api.GetDiagnostic("");
    }

    return error;
}

/******************************************************************************
 **
 ** Function getAPIHandle()
 ** Inputs:  None
 ** Return:  value contained by APIHandle
 **
 ** Description:
 ** Returns the handle to API object if it was previously set,
 ** otherwise it returns null
 **
 *******************************************************************************/
function getAPIHandle() {
    if (apiHandle == null) {
        apiHandle = getAPI();
    }

    return apiHandle;
}


/*******************************************************************************
 **
 ** Function findAPI(win)
 ** Inputs:  win - a Window Object
 ** Return:  If an API object is found, it's returned, otherwise null is returned
 **
 ** Description:
 ** This function looks for an object named API_1484_11 in parent and opener
 ** windows
 **
 *******************************************************************************/
function findAPI(win) {
    var findAPITries = 0;
    while ((win.API_1484_11 == null) && (win.parent != null) && (win.parent != win)) {
        findAPITries++;

        if (findAPITries > 500) {
            message("Error finding API -- too deeply nested.");
            return null;
        }

        win = win.parent;

    }
    return win.API_1484_11;
}

/*******************************************************************************
 **
 ** Function getAPI()
 ** Inputs:  none
 ** Return:  If an API object is found, it's returned, otherwise null is returned
 **
 ** Description:
 ** This function looks for an object named API_1484_11, first in the current window's 
 ** frame hierarchy and then, if necessary, in the current window's opener window
 ** hierarchy (if there is an opener window).
 **
 *******************************************************************************/
function getAPI() {
    var theAPI = findAPI(window);
    if ((theAPI == null) && (window.opener != null) && (typeof (window.opener) != "undefined")) {
        theAPI = findAPI(window.opener);
    }
    if (theAPI == null) {
        message("Unable to find an API adapter");
    }
    return theAPI
}

/*******************************************************************************
 **
 ** Function findObjective(objId)
 ** Inputs:  objId - the id of the objective
 ** Return:  the index where this objective is located 
 **
 ** Description:
 ** This function looks for the objective within the objective array and returns 
 ** the index where it was found or it will create the objective for you and return 
 ** the new index.
 **
 *******************************************************************************/
function findObjective(objId) {
    var num = doGetValue("cmi.objectives._count");
    var objIndex = -1;

    for (var i = 0; i < num; ++i) {
        if (doGetValue("cmi.objectives." + i + ".id") == objId) {
            objIndex = i;
            break;
        }
    }

    if (objIndex == -1) {
        message("Objective " + objId + " not found.");
        objIndex = num;
        message("Creating new objective at index " + objIndex);
        doSetValue("cmi.objectives." + objIndex + ".id", objId);
    }
    return objIndex;
}

/*******************************************************************************
 ** NOTE: This is a SCORM 2004 4th Edition feature.
 *
 ** Function findDataStore(id)
 ** Inputs:  id - the id of the data store
 ** Return:  the index where this data store is located or -1 if the id wasn't found
 **
 ** Description:
 ** This function looks for the data store within the data array and returns 
 ** the index where it was found or returns -1 to indicate the id wasn't found 
 ** in the collection.
 **
 ** Usage:
 ** var dsIndex = findDataStore("myds");
 ** if (dsIndex > -1)
 ** {
 **    doSetValue("adl.data." + dsIndex + ".store", "save this info...");
 ** }
 ** else
 ** {
 **    var appending_data = doGetValue("cmi.suspend_data");
 **    doSetValue("cmi.suspend_data", appending_data + "myds:save this info");
 ** }
 *******************************************************************************/
function findDataStore(id) {
    var num = doGetValue("adl.data._count");
    var index = -1;

    // if the get value was not null and is a number 
    // in other words, we got an index in the adl.data array
    if (num != null && !isNaN(num)) {
        for (var i = 0; i < num; ++i) {
            if (doGetValue("adl.data." + i + ".id") == id) {
                index = i;
                break;
            }
        }

        if (index == -1) {
            message("Data store " + id + " not found.");
        }
    }

    return index;
}
function message(str) {
    if (debug) {
        alert(str);
    }
}
var initWithScorm = false;
var indexScorm = 0;
var ScormEnum = {
    Name: {
        ScoreMin: 'cmi.score.min', //điểm số nhỏ nhất
        ScoreMax: 'cmi.score.max', //điểm số lớn nhất
        TotalTimeLMS: 'cmi.total_time', //thời gian kết thức khóa học trong lms
        CoreExit: "cmi.exit",
        ScoreRaw: 'cmi.score.raw',
        Status: 'cmi.success_status',
        CompletionStatus: 'cmi.completion_status',
        SesstionTime: 'cmi.session_time',
        SuspendData: 'cmi.suspend_data',
        Scale: 'cmi.score.scaled'
    }
}
var getNameScorm = function (index, name) {
    switch (name) {
        case "StudentRespone":
            return 'cmi.interactions.' + index + '.learner_response';
        case "CorrectRespone":
            return 'cmi.interactions.' + index + '.correct_responses.0.pattern';
        case "Result":
            return 'cmi.interactions.' + index + '.result';
        case "CurrentTime":
            return 'cmi.interactions.' + index + '.timestamp';
        case "Id":
            return 'cmi.interactions.' + index + '.id';
        case "ObjectivesId":
            return 'cmi.interactions.' + index + '.objectives.0.id';
        case "Type":
            return 'cmi.interactions.' + index + '.type';
		case "Description":
			return 'cmi.interactions.'+index+'.description';
		case "Weight":
			return 'cmi.interactions.'+index+'.weighting';
		case 'Latency': 
			return 'cmi.interactions.'+index+'.latency'; 
        default:
            break;
    }
}
/****------------- scorm 2004---------------------****/
var ScormModule = function () {
    return {
        //bắt đầu khóa học
        StartLecture: function () {
            var result = doInitialize();
            initWithScorm = result;
            this.SetValue(ScormEnum.Name.CoreExit, "suspend");
        },
        //kết thức khóa học
        EndLecture: function () {
            doTerminate();
        },
        Commit: function () {
            doCommit();
        },
        //set giá trị
        SetValue: function (name, value) {
            doSetValue(name, value);
        },
        //get giá trị
        GetValue: function (name) {
            return doGetValue(name);
        }
    }
}();
ScormModule.StartLecture();