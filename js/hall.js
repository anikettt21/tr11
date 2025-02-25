// hall.js

let hall = "";
let soldSeats = []; // Derived from student registrations stored in localStorage
// Instead of arrays of numbers, these arrays now hold objects { seat: number, removalDate: ISOString }
let removedSeats = []; // Temporarily removed seats
let permanentlyRemovedSeats = []; // Permanently removed seats
let totalSeats = 50; // Default capacity

// Helper: Extract month name from a "YYYY-MM-DD" date string (robust and time zone–independent)
function getMonthFromDate(dateStr) {
  const parts = dateStr.split("-");
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-indexed.
  const date = new Date(year, month, 1);
  return date.toLocaleString('default', { month: 'long' });
}

// Load hall-specific data from localStorage and compute sold seats from student data
function loadHallData() {
  hall = window.location.pathname.includes('hall1') ? 'hall1' : 'hall2';
  removedSeats = JSON.parse(localStorage.getItem("removedSeats_" + hall)) || [];
  permanentlyRemovedSeats = JSON.parse(localStorage.getItem("permanentlyRemovedSeats_" + hall)) || [];
  totalSeats = parseInt(localStorage.getItem("totalSeats_" + hall)) || 50;

  // Filter out deleted students when computing sold seats.
  const students = JSON.parse(localStorage.getItem("students")) || [];
  soldSeats = students.filter(s => s.hall === hall && !s.deleted).map(s => s.seat_number);
  const maxSold = soldSeats.length > 0 ? Math.max(...soldSeats) : 0;
  totalSeats = Math.max(totalSeats, 50, maxSold);
}

// Render the seat layout based on current data
function renderSeats() {
  const seatLayout = document.getElementById('seat-layout');
  seatLayout.innerHTML = '';
  for (let i = 1; i <= totalSeats; i++) {
    const seat = document.createElement('div');
    seat.classList.add('seat');
    seat.textContent = i;
    if (soldSeats.includes(i)) {
      seat.classList.add('sold');
    } else if (isSeatRemoved(i, permanentlyRemovedSeats)) {
      seat.classList.add('removed-permanent');
      addEditIcon(seat, i);
    } else if (isSeatRemoved(i, removedSeats)) {
      seat.classList.add('removed');
      addEditIcon(seat, i);
    } else {
      seat.classList.add('available');
    }
    seatLayout.appendChild(seat);
  }
}

// Helper: Check if a seat (number) is in an array of removal objects
function isSeatRemoved(seatNumber, removalArray) {
  return removalArray.some(item => item.seat === seatNumber);
}

// Load data and render seats
function fetchAndRenderSeats() {
  loadHallData();
  renderSeats();
}

// Helper: Add a pencil (edit) icon to a removed seat
function addEditIcon(seatElement, seatNumber) {
  const editIcon = document.createElement('span');
  editIcon.className = 'edit-icon';
  editIcon.innerHTML = '&#9998;'; // Unicode pencil icon
  editIcon.addEventListener('click', function (e) {
    e.stopPropagation();
    handleEditSeat(seatNumber);
  });
  seatElement.appendChild(editIcon);
}

// Handle editing a seat (restore or mark as permanently removed)
function handleEditSeat(seatNumber) {
  const choice = prompt(
    `For seat ${seatNumber}:\nEnter 1 to restore this seat.\nEnter 2 to mark it permanently removed.`
  );
  if (choice === "1") {
    // Restore: remove any removal records for this seat
    removedSeats = removedSeats.filter(item => item.seat !== seatNumber);
    permanentlyRemovedSeats = permanentlyRemovedSeats.filter(item => item.seat !== seatNumber);
  } else if (choice === "2") {
    // Permanently remove: remove from temporary array then add to permanent array if not already present
    removedSeats = removedSeats.filter(item => item.seat !== seatNumber);
    if (!isSeatRemoved(seatNumber, permanentlyRemovedSeats)) {
      permanentlyRemovedSeats.push({ seat: seatNumber, removalDate: new Date().toISOString() });
    }
  }
  localStorage.setItem("removedSeats_" + hall, JSON.stringify(removedSeats));
  localStorage.setItem("permanentlyRemovedSeats_" + hall, JSON.stringify(permanentlyRemovedSeats));
  renderSeats();
}

// Helper for admin verification using localStorage-based password
function verifyAdmin() {
  return new Promise((resolve, reject) => {
    const adminPass = prompt("Enter Admin Password:");
    const storedPass = localStorage.getItem("adminPassword");
    if (!storedPass || adminPass === storedPass) {
      resolve();
    } else {
      alert("Incorrect admin password.");
      reject();
    }
  });
}

// PLUS button: Add/restore a seat (requires admin verification)
document.getElementById('add-seat-button').addEventListener('click', function () {
  verifyAdmin().then(() => {
    const seatInput = prompt("Enter the seat number to add/restore:");
    if (seatInput === null) return;
    const seatNumber = parseInt(seatInput, 10);
    if (isNaN(seatNumber) || seatNumber < 1) {
      alert("Invalid seat number.");
      return;
    }
    if (soldSeats.includes(seatNumber)) {
      alert("This seat is sold and cannot be restored.");
      return;
    }
    if (seatNumber > totalSeats) {
      totalSeats = seatNumber;
      localStorage.setItem('totalSeats_' + hall, totalSeats);
    } else {
      // Check if the seat is marked as removed in either array
      if (!isSeatRemoved(seatNumber, removedSeats) && !isSeatRemoved(seatNumber, permanentlyRemovedSeats)) {
        alert("This seat is already available.");
        return;
      }
      // Remove removal record for restoration
      removedSeats = removedSeats.filter(item => item.seat !== seatNumber);
      permanentlyRemovedSeats = permanentlyRemovedSeats.filter(item => item.seat !== seatNumber);
    }
    localStorage.setItem("removedSeats_" + hall, JSON.stringify(removedSeats));
    localStorage.setItem("permanentlyRemovedSeats_" + hall, JSON.stringify(permanentlyRemovedSeats));
    renderSeats();
  }).catch(() => {});
});

// MINUS button: Remove a seat (requires admin verification)
document.getElementById('remove-seat-button').addEventListener('click', function () {
  verifyAdmin().then(() => {
    const seatInput = prompt("Enter the seat number you want to remove:");
    if (seatInput === null) return;
    const seatNumber = parseInt(seatInput, 10);
    if (isNaN(seatNumber) || seatNumber < 1 || seatNumber > totalSeats) {
      alert("Invalid seat number.");
      return;
    }
    if (soldSeats.includes(seatNumber)) {
      alert(`Seat ${seatNumber} is sold and cannot be removed.`);
      return;
    }
    if (isSeatRemoved(seatNumber, removedSeats) || isSeatRemoved(seatNumber, permanentlyRemovedSeats)) {
      alert(`Seat ${seatNumber} is already removed.`);
      return;
    }
    removedSeats.push({ seat: seatNumber, removalDate: new Date().toISOString() });
    localStorage.setItem("removedSeats_" + hall, JSON.stringify(removedSeats));
    renderSeats();
  }).catch(() => {});
});
  
// ------------------ Monthly Report Functionality ------------------

// When a month is selected, generate a report that shows counts and offers a full details view.
function showMonthlySeatReport(month) {
  // Sold seats: determined from student registrations for this hall & month.
  const students = JSON.parse(localStorage.getItem("students")) || [];
  const filteredStudents = students.filter(s => 
    s.hall === hall &&
    getMonthFromDate(s.registration_date) === month
  );
  const soldSeatNumbers = filteredStudents.map(s => s.seat_number);
  const soldCount = soldSeatNumbers.length;
  
  // Removed seats: now filter based on removal date month.
  const removedForMonth = removedSeats
    .filter(item => getMonthFromDate(item.removalDate) === month)
    .map(item => item.seat);
  const removedForMonthPermanent = permanentlyRemovedSeats
    .filter(item => getMonthFromDate(item.removalDate) === month)
    .map(item => item.seat);
  const removedSeatNumbers = [...removedForMonth, ...removedForMonthPermanent].sort((a, b) => a - b);
  const removedCount = removedSeatNumbers.length;
  
  // Available seats: seats that are not sold and not removed in the selected month.
  const availableSeatNumbers = [];
  for (let i = 1; i <= totalSeats; i++) {
    if (!soldSeatNumbers.includes(i) && !removedSeatNumbers.includes(i)) {
      availableSeatNumbers.push(i);
    }
  }
  const availableCount = availableSeatNumbers.length;
  
  const reportDiv = document.getElementById("monthly-report");
  reportDiv.innerHTML = `
    <h3>Monthly Report for ${month}</h3>
    <p>Sold Seats: ${soldCount}</p>
    <p>Removed Seats: ${removedCount}</p>
    <p>Available Seats: ${availableCount}</p>
    <button onclick="toggleFullReport('${month}')">View Full Details</button>
    <div id="full-report" style="display:none; margin-top:15px;"></div>
  `;
}

// Toggle full details: show boxes with lists of sold, removed, and available seat numbers.
function toggleFullReport(month) {
  const fullReportDiv = document.getElementById("full-report");
  if (fullReportDiv.style.display === "none") {
    const students = JSON.parse(localStorage.getItem("students")) || [];
    const filteredStudents = students.filter(s => 
      s.hall === hall &&
      getMonthFromDate(s.registration_date) === month
    );
    const soldSeatNumbers = filteredStudents.map(s => s.seat_number);
    
    const removedForMonth = removedSeats
      .filter(item => getMonthFromDate(item.removalDate) === month)
      .map(item => item.seat);
    const removedForMonthPermanent = permanentlyRemovedSeats
      .filter(item => getMonthFromDate(item.removalDate) === month)
      .map(item => item.seat);
    const removedSeatNumbers = [...removedForMonth, ...removedForMonthPermanent].sort((a, b) => a - b);
    
    const availableSeatNumbers = [];
    for (let i = 1; i <= totalSeats; i++) {
      if (!soldSeatNumbers.includes(i) && !removedSeatNumbers.includes(i)) {
        availableSeatNumbers.push(i);
      }
    }
    
    fullReportDiv.innerHTML = `
      <div class="report-box sold-box">
        <h4>Sold Seats</h4>
        <p>${soldSeatNumbers.join(", ") || "None"}</p>
      </div>
      <div class="report-box removed-box">
        <h4>Removed Seats</h4>
        <p>${removedSeatNumbers.join(", ") || "None"}</p>
      </div>
      <div class="report-box available-box">
        <h4>Available Seats</h4>
        <p>${availableSeatNumbers.join(", ") || "None"}</p>
      </div>
    `;
    fullReportDiv.style.display = "block";
  } else {
    fullReportDiv.style.display = "none";
  }
}

// Handler for month dropdown change
function handleMonthChange() {
  const month = document.getElementById("month-select").value;
  if (month) {
    showMonthlySeatReport(month);
  } else {
    document.getElementById("monthly-report").innerHTML = "";
  }
}

// Initialize the seat layout on page load
document.addEventListener('DOMContentLoaded', fetchAndRenderSeats);
