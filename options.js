function loadSettings() {
  let settings = JSON.parse(localStorage.getItem("slogBlockerSettings"));
  document.getElementById("addAvatarTooltips").checked =
    settings.addAvatarTooltips;
  document.getElementById("moveUserBylines").checked = settings.moveUserBylines;
  document.getElementById("addTopPagination").checked =
    settings.addTopPagination;

  document.getElementById("save").addEventListener("click", saveSettings);
}

function saveSettings() {
  let settings = JSON.parse(localStorage.getItem("slogBlockerSettings"));
  settings.addAvatarTooltips = document.getElementById(
    "addAvatarTooltips"
  ).checked;
  settings.moveUserBylines = document.getElementById("moveUserBylines").checked;
  settings.addTopPagination = document.getElementById(
    "addTopPagination"
  ).checked;
  localStorage.setItem("slogBlockerSettings", JSON.stringify(settings));

  chrome.runtime.sendMessage({
    message: "slogBlockerSettingsChanged",
  });

  var event = document.createEvent("Event");
  event.initEvent("slogBlockerSettingsChanged");
  document.dispatchEvent(event);

  var status = document.getElementById("status");
  status.textContent = "Options saved.";
  setTimeout(function () {
    status.textContent = "";
  }, 750);
}

document.addEventListener("DOMContentLoaded", loadSettings);
