/**
 * PHANTOM OS v12.0 | BACKEND CLOUD SCRIPT
 * Syncs Emotions, Habits, and Bio-Metrics to Google Sheets & Calendar.
 */

function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("PHANTOM_LOGS") || ss.insertSheet("PHANTOM_LOGS");
  
  if (sheet.getLastRow() == 0) {
    sheet.appendRow(["TIMESTAMP", "MOOD", "HEALTH_SCORE", "LOG_ENTRIES", "NUTRITION", "GEODATA"]);
  }
  
  var now = new Date();
  var todayKey = Utilities.formatDate(now, "GMT-4", "yyyy-MM-dd");
  var moodToday = data.emotions[todayKey] || "None";
  
  // Update Spreadsheet
  sheet.appendRow([
    now, 
    moodToday, 
    "W:" + data.waterLiters + "L | S:" + data.sleepHours + "H", 
    JSON.stringify(data.logs), 
    JSON.stringify(data.nutrition), 
    data.gps.dist.toFixed(2) + " km"
  ]);

  // GOOGLE CALENDAR INTEGRATION (Requested v12.0)
  if (data.triggerCalendar) {
    try {
      var calendar = CalendarApp.getDefaultCalendar();
      var eventTitle = "PHANTOM OS Log: " + moodToday;
      var eventDesc = "Agua: " + data.waterLiters + "L\nSueno: " + data.sleepHours + "H\nNutricion: " + JSON.stringify(data.nutrition);
      
      // Prevent duplicate events for the same hour
      var eventsToday = calendar.getEventsForDay(now);
      var duplicate = false;
      for (var i = 0; i < eventsToday.length; i++) {
        if (eventsToday[i].getTitle() == eventTitle) duplicate = true;
      }
      
      if (!duplicate) {
        calendar.createEvent(eventTitle, now, new Date(now.getTime() + 15*60000), {description: eventDesc});
      }
    } catch (err) {
      console.log("Calendar Err: " + err);
    }
  }

  return ContentService.createTextOutput(JSON.stringify({result: "success"})).setMimeType(ContentService.MimeType.JSON);
}
