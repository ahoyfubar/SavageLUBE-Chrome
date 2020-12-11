// content.js

if (document.body.classList.contains("article-section-savage-love")) {
  // Set us up to receive messages from the app
  chrome.runtime.onMessage.addListener(handleMessage);
  // Let the extension know we're here
  chrome.runtime.sendMessage({
    message: "DOMContentLoaded",
  });
}

function handleMessage(request, sender, sendResponse) {
  // Filter comments in the DOM
  if (request.message === "filterComments") {
    filterComments(request.appInfo);
  }
  // Refresh after user blocked/muted
  else if (request.message === "settingsUpdated") {
    location.reload();
  }
  return true;
}

function filterComments(appInfo) {
  if (document.body.classList.contains("article-section-savage-love")) {
    var comments = document.body.getElementsByClassName("comment-container");
    for (var i = 0; i < comments.length; i++) {
      var byline = comments[i].getElementsByClassName("comment-byline");
      var name = byline[0].firstChild.nextSibling.firstChild.text;
      var menu = addBlockerMenu(byline[0], name);
      addAvatarSelector(comments[i], name);

      if (Array.isArray(appInfo.users)) {
        var user = appInfo.users.find(
          (u) => u.name.toLowerCase() === name.toLowerCase()
        );
        if (typeof user !== "undefined") {
          if (user.action == "hide") {
            hideComment(comments[i]);
          } else if (user.action === "mute") {
            muteComment(comments[i], user.text, menu);
            updateBlockerMenuMuted(comments[i], menu);
          }
          if (user.avatar !== undefined) {
            replaceAvatar(comments[i], user.avatar);
          }
        }
      }

      if (appInfo.addAvatarTooltips == true) {
        addAvatarTooltip(comments[i], name);
      }
      if (appInfo.moveUserBylines == true) {
        moveUserByline(comments[i]);
      }
      if (appInfo.addCommentLinks == true) {
      }
    }
    if (comments.length > 0 && appInfo.addTopPagination == true) {
      addTopPagination(comments);
    }
  }
}

function addAvatarSelector(comment, name) {
  var image = comment.getElementsByClassName("user-image");
  image[0].onclick = function () {
    var avatar = image[0].getElementsByTagName("img");
    var imgsrc = "";
    if (avatar.length > 0) {
      imgsrc = avatar[0].src;
    }
    var result = window.prompt("Enter Avatar URL", imgsrc);
    if (result) {
      var img = new Image();
      img.onload = function () {
        chrome.runtime.sendMessage({
          message: "changeAvatar",
          userInfo: {
            name: name,
            action: "avatar",
            avatar: result,
          },
        });
        image[0].innerHTML = '<img src="' + result + '" style="width:100%;">';
      };
      img.onerror = function () {
        alert("Image not found at " + result);
      };
      img.src = result;
    }
  };
}

function addBlockerMenu(byline, name) {
  var menu = document.createElement("span");
  menu.classList.add("weak");
  menu.classList.add("blocker-menu");

  var button;

  if (null) {
    button = document.createElement("button");
    button.classList.add("block-user");
    button.appendChild(document.createTextNode("Block user"));
    menu.appendChild(document.createTextNode(" · "));
    menu.appendChild(button);

    button.onclick = function () {
      if (confirm("Are you sure you want to block " + name + "?")) {
        chrome.runtime.sendMessage({
          message: "blockUser",
          userInfo: {
            name: name,
            action: "hide",
          },
        });
      }
    };
  }

  button = document.createElement("button");
  button.classList.add("mute-user");
  button.appendChild(document.createTextNode("Mute user"));
  menu.appendChild(document.createTextNode(" · "));
  menu.appendChild(button);

  button.onclick = function () {
    if (button.classList.contains("unmute-user")) {
      chrome.runtime.sendMessage({
        message: "blockUser",
        userInfo: {
          name: name,
          action: "unmute",
        },
      });
    } else if (confirm("Are you sure you want to mute " + name + "?")) {
      chrome.runtime.sendMessage({
        message: "blockUser",
        userInfo: {
          name: name,
          action: "mute",
        },
      });
    }
  };
  byline.parentNode.appendChild(menu);
  return menu;
}

function updateBlockerMenuMuted(comment, menu) {
  var mute = menu.getElementsByClassName("mute-user");
  changeButtonText(mute[0], "Unmute user");
  mute[0].classList.add("unmute-user");
  mute[0].classList.remove("mute-user");

  var button = document.createElement("button");
  button.classList.add("show-comment");
  button.appendChild(document.createTextNode("Show comment"));
  menu.appendChild(document.createTextNode(" · "));
  menu.appendChild(button);

  button.onclick = function () {
    var body = comment.getElementsByClassName("comment-body");
    var mute = body[0].firstChild.nextSibling;
    if (mute.classList.contains("comment-muted")) {
      mute.classList.remove("comment-muted");
      mute.nextSibling.classList.add("comment-muted");
      changeButtonText(button, "Show comment");
    } else {
      mute.classList.add("comment-muted");
      mute.nextSibling.classList.remove("comment-muted");
      changeButtonText(button, "Hide comment");
    }
  };
}

function changeButtonText(button, text) {
  button.removeChild(button.firstChild);
  button.appendChild(document.createTextNode(text));
}

function hideComment(comment) {
  comment.style.display = "none";
}

function muteComment(comment, mask, menu) {
  var body = comment.getElementsByClassName("comment-body");
  var mute = document.createElement("div");
  mute.classList.add("comment-muted");

  var text = body[0].firstChild.nextSibling.nextSibling;
  while (text) {
    next = text.nextSibling;
    body[0].removeChild(text);
    mute.appendChild(text);
    text = next;
  }

  var para = document.createElement("p");
  if (typeof mask === "undefined") {
    mask = "...";
  }
  para.appendChild(document.createTextNode(mask));

  var toggle = document.createElement("div");
  toggle.classList.add("comment-placeholder");
  toggle.appendChild(para);

  body[0].appendChild(toggle);
  body[0].appendChild(mute);
}

function replaceAvatar(comment, avatar) {
  var image = comment.getElementsByClassName("user-image");
  image[0].innerHTML = '<img src="' + avatar + '" style="width:100%;">';
}

function addAvatarTooltip(comment, name) {
  var image = comment.getElementsByClassName("user-image");
  image[0].classList.add("user-tooltip");

  var tooltip = document.createElement("span");
  tooltip.classList.add("user-tooltip-text");
  tooltip.appendChild(document.createTextNode(name));
  image[0].insertBefore(tooltip, image[0].firstChild);
}

function addTopPagination(comments) {
  var pager = document.getElementById("commentPagination");
  if (pager) {
    var clone = pager.parentNode.cloneNode(true);
    clone.firstChild.id = "commentPaginationTop";
    comments[0].parentNode.insertBefore(clone, comments[0]);
  }
}

function moveUserByline(comment) {
  var header = comment.getElementsByClassName("comment-header");
  var footer = comment.getElementsByClassName("comment-footer");
  var node = footer[0].firstChild;
  while (node) {
    footer[0].removeChild(node);
    header[0].appendChild(node);
    node = footer[0].firstChild;
  }

  var number = comment.getElementsByClassName("comment-number");
  var link = number[0];
  link.parentNode.removeChild(link);
  header[0].appendChild(link);
  header[0].classList.add("text-muted");
  header[0].classList.add("byline-header");
}
