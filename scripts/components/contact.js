'use strict'
// This module controls the City of Boston video component
// ---------------------------
var BostonContact = (function () {
  var to_address;
  var o_message = false;
  var o_subject = false;

  function initEmailLink(emailLink) {
    // Handle the onclick event
    emailLink.addEventListener('click', handleEmailClick);
  }

  function handleEmailClick(ev) {
    ev.preventDefault();

    if (document.getElementById('contactFormTemplate')) {
      document.body.classList.add('no-s');

      var template = document.getElementById('contactFormTemplate');
      var container = document.createElement('div');

      container.id = "contactFormModal";
      container.innerHTML = template.innerHTML;

      document.body.appendChild(container);

      if (ev.target.title && ev.target.title !== '') {
        document.getElementById('contactMessage').innerHTML = ev.target.title;
      }

      var btn = document.getElementById("contactFormModal");
      // Setting new role attributes
      btn.setAttribute("role", "dialog");


      var close = Boston.childByEl(container, 'md-cb');
      close[0].addEventListener('click', handleEmailClose);

      var form = document.getElementById('contactForm');
      form.addEventListener('submit', handleFormSubmit);

      // clear error message on keyup of input field
      handleInputKeyup();

      // Set the hidden fields
      setBrowser(ev.currentTarget);
      setURL(ev.currentTarget);
      setToAddress(ev.currentTarget);
      setBodyMessage(ev.currentTarget);
      setSubject(ev.currentTarget);
      setToken(ev.currentTarget);
    }
  }

  function handleInputKeyup(form) {
    var inputFields = document.getElementsByClassName('txt-f');
    for (var i = 0; i < inputFields.length; i++) {
      inputFields[i].addEventListener("keyup", function() {
        var errorMessage = this.nextElementSibling; 
        if (errorMessage) {
          errorMessage.remove("t--err");
        }
      });
    }
  }

  function handleEmailClose(ev) {
    ev.preventDefault();
    document.body.classList.remove('no-s');
    document.getElementById('contactFormModal').remove();
  }

  function handleFormSubmit(ev) {
    ev.preventDefault();

    var form = document.getElementById('contactForm');
    // Reset the form
    resetForm(form);
    var isValid = validateForm(form);
    var formData = new FormData(form);

    if (isValid) {
      Boston.disableButton(form, 'Loading...');

      Boston.request({
        data: formData,
        url: form.getAttribute('action'),
        method: 'POST',
        success: function (response) {
          if (response.status === 200) {
            form.parentElement.innerHTML = "<p>Thank you for contacting us. We appreciate your interest in the City. If you don’t hear from anyone within five business days, please contact BOS:311 at 3-1-1 or 617-635-4500.</p>";
          } else {
            handleError(form);
          }
        },
        error: function() {
          handleError(form);
        }
      }, "618917a240ee275b780f00bn5aa0d0e6apx08c00600eaa77fgh739322c3f66062f6912lkc435dg67");
    }
  }

  function handleError(form) {
    Boston.enableButton(form, 'Send Message');
  }

  function validateForm(form) {
    var email = Boston.childByEl(form, 'bos-contact-email');
    var email2 = Boston.childByEl(form, 'bos-contact-email2');
    var name = Boston.childByEl(form, 'bos-contact-name');
    var subject = Boston.childByEl(form, 'bos-contact-subject');
    var message = Boston.childByEl(form, 'bos-contact-message');
    var address_to = document.getElementById('contactFormToAddress');
    var email_two = document.getElementById('contact-address-two');
    var valid = true;

    if (email[0].value == '' || !Boston.emailRE.test(email[0].value)) {
      Boston.invalidateField(email[0], "Please enter a valid email address");
      valid = false;
    }

    if (email_two != 'undefined') {
      if (email_two != null) {

        if (email2[0].value == '' || !Boston.emailRE.test(email2[0].value)) {
          Boston.invalidateField(email2[0], "Please enter a valid email address");
          valid = false;
        }

        else if (email2[0].value != email[0].value) {
          Boston.invalidateField(email2[0], "Email does not match");
          valid = false;
        }

      } 
    } else {
      valid = true;
    }

    if (name[0].value == '') {
      Boston.invalidateField(name[0], "Please enter your full name");
      valid = false;
    }

    if (subject[0].value == '') {
      Boston.invalidateField(subject[0], "Please enter a subject");
      valid = false;
    }

    if (message[0].value == '') {
      Boston.invalidateField(message[0], "Please enter a message");
      valid = false;
    }

    if (address_to.value !== to_address) {
      valid = false;
    }

    if (o_subject && subject[0].value !== o_subject) {
      valid = false;
    }

    return valid;
  }

  function setBrowser(link) {
    var browserField = document.getElementById('contactFormBrowser');
    browserField.value = navigator.userAgent;
  }

  function setToAddress(link) {
    var toField = document.getElementById('contactFormToAddress');
    to_address = extract(link.getAttribute('href'), "mailto");
    toField.value = to_address;
  }

  function setBodyMessage(link) {
    var messageField = document.getElementById('contact-message');
    if (o_message = extract(link.getAttribute('href'), "body")) {
      o_message = decodeURIComponent(o_message);
      messageField.value = o_message;
    }
  }

  function setSubject(link) {
    var subjectField = document.getElementById('contact-subject');
    if (o_subject = extract(link.getAttribute('href'), "subject")) {
      o_subject = decodeURIComponent(o_subject);
      subjectField.value = o_subject;
      subjectField.type = "hidden";
      subjectField.parentElement.classList.add("hidden");
    }
  }

  // Request unique session token ID via Drupal endpoint
  function setToken() {
    Boston.request({
        url: '/rest/email_token/create',
        method: 'POST',
        success: function (response) {
          if (response.status === 200) {
            var token = JSON.parse(response.response).token_session;
            document.getElementById('contact-token').value = token;            
          } else {
            console.log("token response error");
          }
        },
        error: function() {
          console.log("token request error");
        }
    });

  }

  function extract(mailtoLink, element) {
    var result = false;
    var linkParts = mailtoLink.split('?');

    if (typeof linkParts[0] !== "undefined" && element.toLowerCase() == "mailto") {
      result =  linkParts[0].replace('mailto:', '')
    }

    if (!result && linkParts.length > 1) {
      var linkElements = linkParts[1].split('&');
      for (var i = 0; i < linkElements.length; i++) {
        var defaultField = linkElements[i].split("=");
        if (typeof defaultField[0] !== "undefined" && defaultField[0] == element) {
          if (typeof defaultField[1] !== undefined) {
            result = defaultField[1];
          } else {
            result = true;
          }
          break;
        }
      }
    }

    return result;
  }

  function setURL(link) {
    var urlField = document.getElementById('contactFormURL');
    urlField.value = window.location.href;
  }

  function resetForm(form) {
    var errors = Boston.childByEl(form, 't--err');

    for (var i = 0; i < errors.length; i++) {
      errors[i].remove();
      i--;
    }
  }

  function start() {

    // The page needs to include a template with id of contactMessage
    if (document.getElementById('contactFormTemplate')) {
      var emailLinks = document.querySelectorAll('a[href^=mailto]:not(.hide-form)');

      if (emailLinks.length > 0) {
        for (var i = 0; i < emailLinks.length; i++) {
          initEmailLink(emailLinks[i]);
        }
      }

    }
  }

  return {
    start: start,
    close: handleEmailClose
  }
})();

BostonContact.start();
