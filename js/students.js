// students.js

document.addEventListener('DOMContentLoaded', function () {
    // Initially render the normal view.
    fetchStudents();
    // Attach cumulative view toggle
    document.getElementById('toggle-cumulative').addEventListener('click', toggleCumulativeView);
});

function fetchStudents() {
    let students = JSON.parse(localStorage.getItem("students")) || [];
    renderStudents(students);
}

function renderStudents(data) {
    const tbody = document.getElementById('student-data');
    tbody.innerHTML = data.map((student, index) => `
        <tr class="${student.deleted ? 'deleted-row' : ''}">
            <td>${index + 1}</td>
            <td>${student.name} ${student.surname}</td>
            <td>${student.phone}</td>
            <td>${student.hall}</td>
            <td>${student.seat_number}</td>
            <td>${new Date(student.registration_date).toLocaleDateString('en-GB')}</td>
            <td>
              <span class="${student.remaining_fees === 'yes' ? 'fees-yes' : 'fees-no'}">
                ${student.remaining_fees === 'yes' ? student.fees_amount : 'No'}
              </span>
            </td>
            <td>${student.seat_type}</td>
            <td>
                ${student.deleted 
                    ? '<em>Deleted</em>' 
                    : `<button onclick="editStudent(${student.id})">Edit</button>
                       <button onclick="deleteStudent(${student.id})">Delete</button>`}
            </td>
        </tr>
    `).join('');
}

function filterStudents() {
    const searchText = document.getElementById('search-bar').value.toLowerCase();
    const filterMonth = document.getElementById('filter-month').value;
    const filterHall = document.getElementById('filter-hall').value;
    const filterSeatType = document.getElementById('filter-seat-type').value;
    let students = JSON.parse(localStorage.getItem("students")) || [];
    const filteredData = students.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchText) ||
                              student.phone.includes(searchText) ||
                              (student.email && student.email.toLowerCase().includes(searchText)) ||
                              student.seat_number.toString().includes(searchText);
        
        // Normal view uses filter-month exactly.
        const matchesMonth = filterMonth ? 
            new Date(student.registration_date).toLocaleString('default', { month: 'long' }) === filterMonth : true;
        const matchesHall = filterHall !== 'all' ? student.hall === filterHall : true;
        const matchesSeatType = filterSeatType ? student.seat_type === filterSeatType : true;
        return matchesSearch && matchesMonth && matchesHall && matchesSeatType;
    });
    renderStudents(filteredData);
}

// Helper function for admin verification using localStorage.
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

function editStudent(id) {
    verifyAdmin().then(() => {
        window.location.href = `registration.html?edit=${id}`;
    }).catch(() => {});
}

function deleteStudent(id) {
    verifyAdmin().then(() => {
        if (confirm('Are you sure you want to delete this student?')) {
            let students = JSON.parse(localStorage.getItem("students")) || [];
            students = students.map(student => {
                if (Number(student.id) === Number(id)) {
                    student.deleted = true;
                }
                return student;
            });
            localStorage.setItem("students", JSON.stringify(students));
            alert("Student marked as deleted.");
            fetchStudents();
        }
    }).catch(() => {});
}

// --- Cumulative (Timeline) View ---
// In cumulative view, we apply the search and filter (hall and seat type) criteria,
// but ignore the filter-month dropdown since cumulative view groups by month.

const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function renderCumulativeStudents() {
    // Get all students from localStorage
    let students = JSON.parse(localStorage.getItem("students")) || [];
    
    // Apply filters: search, hall, seat type
    const searchText = document.getElementById('search-bar').value.toLowerCase();
    const filterHall = document.getElementById('filter-hall').value;
    const filterSeatType = document.getElementById('filter-seat-type').value;
    
    students = students.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchText) ||
                              student.phone.includes(searchText) ||
                              (student.email && student.email.toLowerCase().includes(searchText)) ||
                              student.seat_number.toString().includes(searchText);
        const matchesHall = filterHall !== 'all' ? student.hall === filterHall : true;
        const matchesSeatType = filterSeatType ? student.seat_type === filterSeatType : true;
        return matchesSearch && matchesHall && matchesSeatType;
    });
    
    // Sort students by registration date.
    students.sort((a, b) => new Date(a.registration_date) - new Date(b.registration_date));
    
    // Get unique registration month numbers from filtered students.
    let uniqueMonths = [
      ...new Set(
        students.map(s => parseInt(s.registration_date.split("-")[1], 10))
      )
    ];
    uniqueMonths.sort((a, b) => a - b);
    
    let html = "";
    // For each unique month, display a cumulative table of all students
    // whose registration month is less than or equal to that month.
    uniqueMonths.forEach((monthNum) => {
        const cumulativeStudents = students.filter(s => {
            const regMonth = parseInt(s.registration_date.split("-")[1], 10);
            return regMonth <= monthNum;
        });
        if (cumulativeStudents.length > 0) {
            const monthName = monthNames[monthNum - 1];
            html += `<h3>${monthName}</h3>`;
            html += `<table class="cumulative-table"><thead><tr>
                      <th>#</th><th>Name</th><th>Phone</th><th>Hall</th><th>Seat</th><th>Reg Date</th>
                     </tr></thead><tbody>`;
            cumulativeStudents.forEach((s, i) => {
                html += `<tr ${s.deleted ? 'class="deleted-row"' : ''}>
                         <td>${i + 1}</td>
                         <td>${s.name} ${s.surname}</td>
                         <td>${s.phone}</td>
                         <td>${s.hall}</td>
                         <td>${s.seat_number}</td>
                         <td>${new Date(s.registration_date).toLocaleDateString('en-GB')}</td>
                         </tr>`;
            });
            html += `</tbody></table>`;
        }
    });
    document.getElementById("cumulative-container").innerHTML = html;
}

function toggleCumulativeView() {
    const cumulativeContainer = document.getElementById("cumulative-container");
    const normalContainer = document.getElementById("normal-view");
    if (cumulativeContainer.style.display === "none" || cumulativeContainer.style.display === "") {
        cumulativeContainer.style.display = "block";
        normalContainer.style.display = "none";
        renderCumulativeStudents();
    } else {
        cumulativeContainer.style.display = "none";
        normalContainer.style.display = "block";
    }
}
function fetchStudents() {
    fetch('http://localhost:5000/api/students')
        .then(response => response.json())
        .then(data => {
            renderStudents(data);
        })
        .catch(error => console.error('Error:', error));
}
