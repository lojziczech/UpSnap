//
// notifications
//

class BulmaNotification {
    constructor() {
        // Create DOM notification structure when instantiated
        this.init();
    }

    init() {
        this.hideTimeout = null;

        // Creating the notification container div
        this.containerNode = document.createElement("div");
        this.containerNode.className = "notification note";

        // Adding the notification title node
        this.titleNode = document.createElement('p');
        this.titleNode.className = "note-title";

        // Adding the notification message content node
        this.messageNode = document.createElement('p');
        this.messageNode.className = "note-content";

        // Adding a little button on the notification
        this.closeButtonNode = document.createElement('button');
        this.closeButtonNode.className = "delete";
        this.closeButtonNode.addEventListener('click', () => {
            this.close();
        });

        // Appending the container with all the elements newly created
        this.containerNode.appendChild(this.closeButtonNode);
        this.containerNode.appendChild(this.titleNode);
        this.containerNode.appendChild(this.messageNode);

        // Inserting the notification to the page body
        document.body.appendChild(this.containerNode);
    }

    // Make the notification visible on the screen
    show(title, message, context, duration) {
        clearTimeout(this.hideTimeout);
        this.containerNode.classList.add("note-visible");

        // Setting a title to the notification
        if (title != undefined)
            this.titleNode.textContent = title;
        else
            this.titleNode.textContent = "Notification Title"

        // Setting a message to the notification
        if (message != undefined)
            this.messageNode.textContent = message;
        else
            this.messageNode.textContent = "Notification message";

        // Applying Bulma notification style/theme
        if (context) {
            var classList = context.split(" ")
            for (let index = 0; index < classList.length; index++) {
                this.containerNode.classList.add(classList[index]);
            }
        }

        // Default duration delay
        if (duration == undefined)
            duration = 1500;
        else if (duration <= 0 && duration != -1) {
            console.error('Bulma-notifications : the duration parameter value is not valid.' + "\n" +
                'Make sure this value is strictly greater than 0.');
        } else if (duration != -1) {
            // Waiting a given amout of time  
            this.hideTimeout = setTimeout(() => {
                this.close();
            }, duration);
        }
    }

    // Hide notification
    close() {
        this.containerNode.classList.remove("note-visible");
    }
}

let notif;
window.onload = () => {
    notif = new BulmaNotification();
};

//
// set device status
//

function setDeviceUp(device) {
    // get elements
    var deviceBox = document.getElementById(device.id + "-container");
    var statusDot = document.getElementById(device.id + "-dot");
    var statusPorts = document.getElementById(device.id + "-ports");
    var wakeButton = document.getElementById(device.id + "-btn-wake");
    
    // check if device was down before
    if (statusDot.classList.contains("dot-down")) {
        notif.show("Device now up!", device.name + " is now up.", "is-success is-light", 5000);
    }

    // clear current animation
    statusDot.style.animation = "none";
    statusDot.offsetWidth;

    const openPorts = []

    // set dot
    statusDot.classList.remove("dot-waiting");
    statusDot.classList.remove("dot-down");
    statusDot.classList.add("dot-up");
    statusDot.style.animation = "green-pulse 1s normal";
    // set box border left
    deviceBox.classList.remove("box-waiting");
    deviceBox.classList.remove("box-down");
    deviceBox.classList.add("box-up");
    // set ports
    if (device.vnc) {
        openPorts.push("<li><i class='fas fa-check fa-fw'></i> <strong>VNC (5900)</strong></li>");
    } else {
        openPorts.push("<li><i class='fas fa-times fa-fw'></i> VNC (5900)</li>");
    }
    if (device.rdp) {
        openPorts.push("<li><i class='fas fa-check fa-fw'></i> <strong>RDP (3389)</strong></li>");
    } else {
        openPorts.push("<li><i class='fas fa-times fa-fw'></i> RDP (3389)</li>");
    }
    if (device.ssh) {
        openPorts.push("<li><i class='fas fa-check fa-fw'></i> <strong>SSH (22)</strong></li>");
    } else {
        openPorts.push("<li><i class='fas fa-times fa-fw'></i> SSH (22)</li>");
    }
    statusPorts.innerHTML = '<ul>' + openPorts.join('') + '</ul>';
    // set wake btn
    wakeButton.classList.remove("is-loading");
    wakeButton.disabled = true;
}

function setDeviceDown(device) {
    // get elements
    var deviceBox = document.getElementById(device.id + "-container");
    var statusDot = document.getElementById(device.id + "-dot");
    var statusPorts = document.getElementById(device.id + "-ports");
    var wakeButton = document.getElementById(device.id + "-btn-wake");

    // check if device was up before
    if (statusDot.classList.contains("dot-up")) {
        notif.show("Device now down!", device.name + " is now down.", "is-error is-light", 5000);
    }
    
    // clear current animation
    statusDot.style.animation = "none";
    statusDot.offsetWidth;

    const openPorts = []

    // set dot
    statusDot.classList.remove("dot-waiting");
    statusDot.classList.remove("dot-up");
    statusDot.classList.add("dot-down");
    statusDot.style.animation = "red-pulse 1s normal";
    // set box border left
    deviceBox.classList.remove("box-waiting");
    deviceBox.classList.remove("box-up");
    deviceBox.classList.add("box-down");
    // set ports
    openPorts.push("<li><i class='fas fa-times fa-fw'></i> VNC (5900)</li>");
    openPorts.push("<li><i class='fas fa-times fa-fw'></i> RDP (3389)</li>");
    openPorts.push("<li><i class='fas fa-times fa-fw'></i> SSH (22)</li>");
    statusPorts.innerHTML = '<ul>' + openPorts.join('') + '</ul>';
    // set wake btn
    wakeButton.disabled = false;
    wakeButton.addEventListener("click", function() {
        setDeviceWake(device.id);
    });
}

function setDeviceWake(id) {
    socket.send(id);
}

//
// websocket handling
//

var socket = new WebSocket("ws://" + location.host + "/wol/");
socket.onmessage = function (event) {
    var message = JSON.parse(event.data);
    console.log(message);

    // set visitors element
    if ("visitors" in message) {
        if (message.visitors == 1) {
            document.getElementById("visitors").innerHTML = message.visitors + ' visitor';
        } else {
            document.getElementById("visitors").innerHTML = message.visitors + ' visitors';
            notif.show("Visitors updated", "There are currently " + message.visitors + " visitors", "is-info is-light", 5000);
        }
        return;
    }

    // set wake button
    if ("wake" in message) {
        document.getElementById(message.wake.pk + "-btn-wake").classList.add("is-loading");
        notif.show("Wake started", message.wake.fields.name + " has been started.", "is-info is-light", 5000);
        return;
    }

    // set devices up or down
    if (message.device.up == true) {
        setDeviceUp(message.device);
    } else {
        setDeviceDown(message.device);
    }
}