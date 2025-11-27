let students = JSON.parse(localStorage.getItem("students")) || [];

function saveData() { localStorage.setItem("students", JSON.stringify(students)); updateUI(); }

// Show section
function showSection(section) {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    document.getElementById(section).style.display = 'block';
    if(section==="dashboard") updateChart();
}

// Add student
document.getElementById('addStudentBtn').addEventListener('click',()=>{
    const id = document.getElementById('studentID').value.trim();
    const name = document.getElementById('studentName').value.trim();
    const phone = document.getElementById('studentPhone').value.trim();
    if(id && name && phone){
        students.push({id,name,phone,paid:false,datePaid:null});
        saveData();
        document.getElementById('studentID').value='';
        document.getElementById('studentName').value='';
        document.getElementById('studentPhone').value='';
    } else alert("Please fill all fields");
});

// Update UI
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
    const searchVal = document.getElementById('searchInput')?.value.toLowerCase() || '';
    table.innerHTML='';
    students.filter(s=>s.id.toLowerCase().includes(searchVal) || s.name.toLowerCase().includes(searchVal)).forEach((s,i)=>{
        const tr = document.createElement('tr');
        tr.innerHTML=`
            <td>${s.id}</td>
            <td>${s.name}</td>
            <td>${s.phone}</td>
            <td class="${s.paid?'paid':'unpaid'}">${s.paid?'Paid':'Unpaid'}</td>
            <td>
                <button class="pay-btn" onclick="markPaid(${i})">${s.paid?'Unpay':'Pay'}</button>
                <button class="receipt-btn" onclick="generateReceipt(${i})">Receipt</button>
                <button class="whatsapp-btn" onclick="sendWhatsapp(${i})">WhatsApp</button>
            </td>`;
        table.appendChild(tr);
    });

    updateChart();
}

// Mark paid/unpaid
function markPaid(i){
    students[i].paid = !students[i].paid;
    students[i].datePaid = students[i].paid ? new Date().toLocaleDateString() : null;
    saveData();
}

// Generate receipt
function generateReceipt(i){
    const stu = students[i];
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
            <p><b>Date Paid:</b> ${stu.datePaid}</p>
            <p>✅ Thank you for your payment!</p>
        </div>`;
    let win = window.open("", "_blank");
    win.document.write(receiptHTML);
    win.print();
}

// WhatsApp alert
function sendWhatsapp(i){
    const stu = students[i];
    const msg = `Hello ${stu.name}, this is a reminder from your tuition. Your payment status is: ${stu.paid?'Paid':'Unpaid'}.`;
    const url = `https://wa.me/${stu.phone.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`;
    window.open(url,'_blank');
}

// Search
document.getElementById('searchInput')?.addEventListener('input',updateUI);

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

// Init
updateUI();
showSection('dashboard');


