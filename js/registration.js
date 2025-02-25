document.getElementById('registration-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const student = {
        name: document.getElementById('name').value,
        surname: document.getElementById('surname').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        hall: document.getElementById('hall').value,
        seat_number: parseInt(document.getElementById('seat').value),
        seat_type: document.getElementById('seat-type').value,
        payment_method: document.getElementById('payment-method').value,
        remaining_fees: document.getElementById('remaining-fees').value,
        fees_amount: document.getElementById('remaining-fees').value === 'yes' ? parseInt(document.getElementById('fees').value) : 0,
        registration_date: document.getElementById('registration-date').value
    };

    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');

    if (editId) {
        // Update student via PUT request
        fetch(`http://localhost:5000/api/students/${editId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(student)
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            window.location.href = "students.html";
        })
        .catch(error => console.error('Error:', error));
    } else {
        // Create new student via POST request
        fetch('http://localhost:5000/api/students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(student)
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            window.location.href = "students.html";
        })
        .catch(error => console.error('Error:', error));
    }
});
