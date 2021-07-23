document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  document.querySelector('form').onsubmit = send_email;
  // By default, load the inbox
  load_mailbox('inbox');
});

function send_email(event) {
  const recipients = document.querySelector("#compose-recipients").value;
  const subject = document.querySelector("#compose-subject").value;
  const body = document.querySelector("#compose-body").value;

  fetch("/emails", {
    method: "POST",
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body,
    }),
  })

  .then((response) => response.json())
  .then(result => {
    console.log(result);
  })
  localStorage.clear();
  load_mailbox('sent');
  return false;
}

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
        const list = [['sender', 4], ['subject', 4], ['timestamp', 4]];
        const header = {'sender': 'Sender', 'subject': 'Subject', 'timestamp': 'Date and time',
            'read': true};
        emails = [header, ...emails];
        emails.forEach(email => {
            let div = document.createElement('div');
            div.className = email['read'] ? "unread" : "read";
            div.classList.add("row");
            list.forEach(
                mail => {
                    const list_name = mail[0];
                    const list_size = mail[1];
                    const div_section = document.createElement('div');
                    div_section.classList.add(`col-${list_size}`);
                    div_section.innerHTML = `<p>${email[list_name]}</p>`;
                    div.append(div_section);
                });
              if (email !== header) {
                div.addEventListener('click', () => load_email(email["id"], mailbox));
              }
            document.querySelector('#emails-view').append(div);
        })
    })
    
}

function load_email(id) {
  fetch('/emails/' + id)
  .then(response => response.json())
  .then(email => {

    // show email and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'block';

    // display email
    const view = document.querySelector('#email-view');
    view.innerHTML = `
      <b>From:</b> <span>${email['sender']}</span>
      <br>
      <b>To: </b><span>${email['recipients']}</span>
      <br>
      <b>Subject:</b> <span>${email['subject']}</span>
      <br>
      <b>Time:</b> <span>${email['timestamp']}</span>
      <p style="border:1px solid black; width:75%;">${email['body']}</p>
    `;

    // create archive button & append to DOM
    archiveButton = document.createElement('button');
    archiveButton.innerHTML = !email['archived'] ? 'Archive' : 'Unarchive';
    archiveButton.addEventListener('click', function() {
      fetch('/emails/' + email['id'], {
        method: 'PUT',
        body: JSON.stringify({ archived : !email['archived'] })
      })
      .then(response => load_mailbox('archive'))
    });
    view.appendChild(archiveButton);

    // create mark as unread button & append to DOM
    readButton = document.createElement('button');
    readButton.innerHTML = "Mark as Unread"
    readButton.addEventListener('click', function() {
      fetch('/emails/' + email['id'], {
        method: 'PUT',
        body: JSON.stringify({ read : false })
      })
      .then(response => load_mailbox('inbox'))
    })
    view.appendChild(readButton);

    // mark this email as read
    if (!email['read']) {
      fetch('/emails/' + email['id'], {
        method: 'PUT',
        body: JSON.stringify({ read : true })
      })
    }
  });
}
