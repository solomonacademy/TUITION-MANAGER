// script.js (FINAL VERSION for Firebase Cloud Functions)

// --- Configuration ---
// NOTE: This URL uses the project ID defined in the index.html file.
// For local testing, ensure your Firebase emulators are running (`firebase emulators:start`).
// When deployed, this URL will automatically resolve to your live function URL if hosting is used.
const API_BASE_URL = `http://localhost:5001/${FIREBASE_PROJECT_ID}/us-central1/api`; 
const API_URL = `${API_BASE_URL}/students`; 

let students = []; 

// --- Utility Functions ---

// Fetch data from the backend and update the UI
async function fetchStudents(searchQuery = '') {
    try {
        // Fetch all students (filtering happens on the frontend for simplicity)
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch students.');
        
        let fetchedStudents = await response.json();
        
        // Apply frontend filter if search query is present
        if (searchQuery) {
            fetchedStudents = fetchedStudents.filter(s => 
                s.id.toLowerCase().includes(searchQuery) || 
                s.name.toLowerCase().includes(searchQuery)
            );
        }

        students = fetchedStudents;
        updateUI();

    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('totalStudents').textContent = 'API Error';
    }
}

// Show section
function showSection(section) {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    document.getElementById(section).style.display = 'block';
    if(section==="dashboard") updateChart();
    if(section==="students") fetchStudents(document.getElementById('searchInput')?.value.toLowerCase() || '');
}

// --- Student Actions (API Interaction) ---

// Add student
document.getElementById('addStudentBtn').addEventListener('click', async () => {
    const id = document.getElementById('studentID').value.trim();
    const name = document.getElementById('studentName').value.trim();
    const phone = document.getElementById('studentPhone').value.trim();

    if(id && name && phone){
        try {
            const newStudent = { id, name, phone };
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newStudent)
            });

            const result = await response.json();

            if (!response.ok) {
                alert(`Error: ${result.message || 'Could not add student.'}`);
                return;
            }

            // Success: clear form and refresh data
            document.getElementById('studentID').value='';
            document.getElementById('studentName').value='';
            document.getElementById('studentPhone').value='';
            alert(`Student ${name} registered successfully!`);
            await fetchStudents(document.getElementById('searchInput')?.value.toLowerCase() || ''); 
            
        } catch (error) {
            console.error('Error adding student:', error);
            alert("Failed to connect to the server or add student.");
        }
    } else {
        alert("Please fill all fields");
    }
});

// Mark paid/unpaid
async function markPaid(studentObjectId){
    try {
        // Use the base URL + document ID for the PATCH request
        const response = await fetch(`${API_BASE_URL}/students/${studentObjectId}/payment`, {
            method: 'PATCH'
        });

        if (!response.ok) throw new Error('Failed to update payment status.');

        await fetchStudents(document.getElementById('searchInput')?.value.toLowerCase() || ''); 
        
    } catch (error) {
        console.error('Error marking paid:', error);
        alert('Could not update payment status.');
    }
}

// --- UI Updates (Data Display) ---

function updateUI(){
    // Stats
    const total = students.length;
    const paidCount = students.filter(s=>s.paid).length;
    const unpaidCount = total-paidCount;
    document.getElementById('totalStudents').textContent = total;
    document.getElementById('paidStudents').textContent = paidCount;
    document.getElementById('unpaidStudents').textContent = unpaidCount;

    // Table
    const table = document.getElementById('studentTable');
    table.innerHTML='';

    students.forEach((s)=>{
        const tr = document.createElement('tr');
        // s._id is the Firestore document ID
        tr.innerHTML=`
            <td>${s.id}</td>
            <td>${s.name}</td>
            <td>${s.phone}</td>
            <td class="${s.paid?'paid':'unpaid'}">${s.paid?'Paid':'Unpaid'}</td>
            <td>
                <button class="pay-btn" onclick="markPaid('${s._id}')">${s.paid?'Unpay':'Pay'}</button>
                <button class="receipt-btn" onclick="generateReceipt('${s._id}')">Receipt</button>
                <button class="whatsapp-btn" onclick="sendWhatsapp('${s.name}', '${s.phone}', '${s.paid}')">WhatsApp</button>
            </td>`;
        table.appendChild(tr);
    });

    updateChart();
}

// Generate receipt
async function generateReceipt(studentObjectId){
    try {
        // Fetch single student data using the ID
        const response = await fetch(`${API_BASE_URL}/students/${studentObjectId}`);
        if (!response.ok) throw new Error('Receipt data not found.');
        const stu = await response.json();

        if (!stu) {
            alert("Student data not found for receipt.");
            return;
        }

        const tutorName = "Mr SOLOMON";
        const logoURL = "https://img.sanishtech.com/u/2d7309eb5192d8a9599ac0ee4d2b1281.jpg";
        const receiptHTML = `
            <div style="font-family:'Roboto', sans-serif; text-align:center; padding:20px;">
                <img src="${logoURL}" style="width:120px; margin-bottom:20px; border-radius:15px;">
                <h2 style="margin-bottom:15px; color:#4a6cf7;">Payment Receipt</h2>
                <p><b>Tuition Tutor:</b> ${tutorName}</p>
                <p><b>Student ID:</b> ${stu.id}</p>
                <p><b>Name:</b> ${stu.name}</p>
                <p><b>Phone:</b> ${stu.phone}</p>
                <p><b>Date Paid:</b> ${stu.datePaid || 'N/A'}</p>
                <p>✅ Thank you for your payment!</p>
            </div>`;
        let win = window.open("", "_blank");
        win.document.write(receiptHTML);
        win.print();

    } catch (error) {
        console.error('Error generating receipt:', error);
        alert('Failed to generate receipt: Could not fetch student details.');
    }
}

// WhatsApp alert
function sendWhatsapp(name, phone, isPaid){
    const msg = `Hello ${name}, this is a reminder from your tuition. Your payment status is: ${isPaid === 'true' ? 'Paid' : 'Unpaid'}.`;
    const url = `https://wa.me/${phone.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`;
    window.open(url,'_blank');
}

// Search (Triggers a new frontend filter/fetch)
document.getElementById('searchInput')?.addEventListener('input', (e) => {
    fetchStudents(e.target.value.toLowerCase());
});

// Chart
let chart;
function updateChart(){
    const paid = students.filter(s=>s.paid).length;
    const unpaid = students.length-paid;
    const ctx = document.getElementById('paymentChart').getContext('2d');
    if(chart) chart.destroy();
    chart = new Chart(ctx,{
        type:'pie',
        data:{
            labels:['Paid','Unpaid'],
            datasets:[{data:[paid,unpaid],backgroundColor:['#28a745','#dc3545']}]
        },
        options:{responsive:true, maintainAspectRatio:false}
    });
}

// Init - Start the process by loading data
fetchStudents();
showSection('dashboard');
