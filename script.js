// ==========================================================================
// FIREBASE CLOUD SYNC ARCHITECTURE
// Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyDFl4-sRsJV2ukzWRCeg5sCtO0g-6Yfj4Q",
    authDomain: "ymazualko.firebaseapp.com",
    projectId: "ymazualko",
    storageBucket: "ymazualko.firebasestorage.app",
    messagingSenderId: "881204955464",
    appId: "1:881204955464:web:c07aa42e6a6348fb17cb7d",
    measurementId: "G-ZE0X6GSC6Z"
  };

// Initialize Cloud Core Environment
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

document.addEventListener("DOMContentLoaded", function () {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const currentDate = `${year}-${month}-${day}`;

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;

    document.getElementById('inThihNi').value = currentDate;
    document.getElementById('inVuiNi').value = currentDate;
    
    document.getElementById('inThihHun').value = currentTime;
    document.getElementById('inVuiHun').value = currentTime;

    updatePoster();
    evaluateSessionPersistence();
    initializeRealtimeDatabaseListener();
});        

const inputs = ['inHming', 'inKum', 'inSo', 'inRelationType', 'inSection', 'inVuitu', 'inKohhran', 'inMipa', 'inHmeichhia', 'inRuang', 'inFooter', 'inHeaderText'];
const dateFields = ['inThihNi', 'inVuiNi'];
const timeFields = ['inThihHun', 'inVuiHun'];

let currentPassportBase64 = "";

function formatCustomDate(strVal) {
    if (!strVal) return "";
    const d = new Date(strVal);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = d.getDate();
    let suffix = "th";
    if (day === 1 || day === 21 || day === 31) suffix = "st";
    else if (day === 2 || day === 22) suffix = "nd";
    else if (day === 3 || day === 23) suffix = "rd";
    return `Dt. ${day}${suffix} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatCustomTime(strVal) {
    if (!strVal) return "";
    const parts = strVal.split(':');
    let hours = parseInt(parts[0]);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
}

function updatePoster() {
    inputs.forEach(id => {
        if (id === 'inRelationType') {
            document.getElementById('lblRelationLabel').innerText = document.getElementById(id).value;
        } else {
            const targetId = id.replace('in', 'lbl');
            const targetElem = document.getElementById(targetId);
            if (targetElem) targetElem.innerText = document.getElementById(id).value;
        }
    });

    dateFields.forEach(id => {
        const targetId = id.replace('in', 'lbl');
        document.getElementById(targetId).innerText = formatCustomDate(document.getElementById(id).value);
    });

    timeFields.forEach(id => {
        const targetId = id.replace('in', 'lbl');
        document.getElementById(targetId).innerText = formatCustomTime(document.getElementById(id).value);
    });

    const mipa = parseInt(document.getElementById('inMipa').value) || 0;
    const hmeichhia = parseInt(document.getElementById('inHmeichhia').value) || 0;
    const ruang = parseInt(document.getElementById('inRuang').value) || 0;
    document.getElementById('lblTotal').innerText = mipa + hmeichhia + ruang;
    document.getElementById('lblThlanmual').innerText = 134 + mipa + hmeichhia; 
}

function structuralResponsiveResizeHandler() {
    const containerBox = document.querySelector('.poster-scale-box');
    const posterItem = document.getElementById('posterArea');
    if(containerBox && posterItem) {
        const currentWidth = containerBox.offsetWidth;
        const targetedScaleFactor = currentWidth / 700;
        posterItem.style.transform = `scale(${targetedScaleFactor})`;
    }
}

function setupImageUpload(inputId, viewId) {
    document.getElementById(inputId).addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                document.getElementById(viewId).src = event.target.result;
                if(inputId === 'inPassport') {
                    currentPassportBase64 = event.target.result;
                }
            };
            reader.readAsDataURL(file);
        }
    });
}

inputs.concat(dateFields).concat(timeFields).forEach(id => {
    const elem = document.getElementById(id);
    if(elem) elem.addEventListener('input', updatePoster);
    if(elem && elem.tagName === 'SELECT') elem.addEventListener('change', updatePoster);
});

setupImageUpload('inPassport', 'viewPassport');
setupImageUpload('inQr', 'viewQr');
setupImageUpload('inMapImage', 'mapImage');

window.addEventListener('resize', structuralResponsiveResizeHandler);
structuralResponsiveResizeHandler();

document.getElementById('btnDownload').addEventListener('click', function () {
    const posterArea = document.getElementById('posterArea');
    const originalTransformStyle = posterArea.style.transform;
    
    posterArea.style.transform = "none";

    html2canvas(posterArea, {
        useCORS: true,
        scale: 2, 
        width: 700,
        height: 700
    }).then(canvas => {
        posterArea.style.transform = originalTransformStyle;

        const downloadLink = document.createElement('a');
        downloadLink.download = 'zualko-notice.png';
        downloadLink.href = canvas.toDataURL('image/png');
        downloadLink.click();
    }).catch(err => {
        console.error("Export failure: ", err);
        posterArea.style.transform = originalTransformStyle;
    });
});

// ==========================================================================
// CENTRAL REAL-TIME LIVE SUBSCRIBER STREAMS (FIREBASE DATABASES)
// ==========================================================================
function initializeRealtimeDatabaseListener() {
    database.ref('zualkoRecords').on('value', (snapshot) => {
        const tbody = document.getElementById('tableBody');
        tbody.innerHTML = "";
        
        const currentAuthRole = sessionStorage.getItem('zualkoAuthRole');
        const isAdmin = currentAuthRole === 'admin';

        if (snapshot.exists()) {
            const serverRecords = snapshot.val();
            Object.keys(serverRecords).forEach((uniqueKey) => {
                const item = serverRecords[uniqueKey];
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td style="text-align: center;"><img src="${item.photo}" class="table-thumb" alt="photo"></td>
                    <td><strong>${item.hming}</strong></td>
                    <td>${item.kum}</td>
                    <td>${item.chhungte}</td>
                    <td>${item.section}</td>
                    <td>${item.thihni}</td>
                    <td>${item.kohhran}</td>
                    <td class="admin-actions" style="display: ${isAdmin ? 'table-cell' : 'none'};">
                        <button class="btn-delete" onclick="deleteRecord('${uniqueKey}')">Delete</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
        toggleAdminInterfaceElements(isAdmin);
    });
}

document.getElementById('btnSubmit').addEventListener('click', function() {
    const hming = document.getElementById('inHming').value.trim();
    if (!hming) {
        alert("Khawngaihin Hming ziak hmasa rawh.");
        return;
    }

    const defaultPlaceholder = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='%23ccc'/><text x='50' y='55' font-size='10' text-anchor='middle' fill='%23666'>No Photo</text></svg>";

    const itemRecord = {
        timestamp: Date.now(),
        photo: currentPassportBase64 || defaultPlaceholder,
        hming: hming,
        kum: document.getElementById('inKum').value || 'N/A',
        chhungte: `${document.getElementById('inRelationType').value} ${document.getElementById('inSo').value}`,
        section: document.getElementById('inSection').value,
        thihni: formatCustomDate(document.getElementById('inThihNi').value),
        kohhran: document.getElementById('inKohhran').value || 'N/A'
    };

    database.ref('zualkoRecords').push(itemRecord)
        .then(() => {
            currentPassportBase64 = "";
            document.getElementById('inHming').value = "";
            document.getElementById('inKum').value = "";
            document.getElementById('inSo').value = "";
            document.getElementById('inKohhran').value = "";
            document.getElementById('inPassport').value = "";
            document.getElementById('viewPassport').src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23ccc'/><text x='50' y='55' font-size='10' text-anchor='middle' fill='%23666'>No Photo (1:1 Ratio)</text></svg>";
            updatePoster();
        })
        .catch((error) => {
            alert("Data thun luh a hlawhchham: " + error.message);
        });
});

window.deleteRecord = function(uniqueKey) {
    if(confirm("He record hi i paih duh chiang maw?")) {
        database.ref(`zualkoRecords/${uniqueKey}`).remove()
            .catch((error) => {
                alert("Huih phelh a hlawhchham: " + error.message);
            });
    }
};

// ==========================================================================
// UNIFIED PORTAL APP ROUTER & SESSION MANAGEMENT 
// ==========================================================================
document.getElementById('btnUserSubmitLogin').addEventListener('click', function() {
    const u = document.getElementById('userLoginName').value.trim();
    const p = document.getElementById('userLoginPass').value.trim();

    if (u === 'kpluser' && p === 'Kpluseryma@1') {
        sessionStorage.setItem('zualkoAuthRole', 'user');
        evaluateSessionPersistence();
    } else {
        alert("Uluk Deuhin Awwww!!!");
    }
});

document.getElementById('btnAdminSubmitLogin').addEventListener('click', function() {
    const u = document.getElementById('adminLoginName').value.trim();
    const p = document.getElementById('adminLoginPass').value.trim();

    if (u === 'kpladmin' && p === 'Mizoram@123') {
        sessionStorage.setItem('zualkoAuthRole', 'admin');
        evaluateSessionPersistence();
    } else {
        alert("Uluk Deuhin Awwww!!!");
    }
});

document.getElementById('btnPerformLogout').addEventListener('click', function() {
    sessionStorage.removeItem('zualkoAuthRole');
    evaluateSessionPersistence();
});

function evaluateSessionPersistence() {
    const currentAuthRole = sessionStorage.getItem('zualkoAuthRole');
    
    const loginPortalGate = document.getElementById('loginPortalGate');
    const mainDashboardApplication = document.getElementById('mainDashboardApplication');
    const authRoleBadge = document.getElementById('authRoleBadge');

    if (currentAuthRole === 'admin' || currentAuthRole === 'user') {
        // Route View Transition to Main Dashboard Page
        loginPortalGate.style.display = 'none';
        mainDashboardApplication.style.display = 'block';

        if(currentAuthRole === 'admin') {
            authRoleBadge.innerText = "Admin Account Active";
            authRoleBadge.style.backgroundColor = "#e6f4ea";
            authRoleBadge.style.color = "#137333";
            toggleAdminInterfaceElements(true);
        } else {
            authRoleBadge.innerText = "User Account Active";
            authRoleBadge.style.backgroundColor = "#e8f0fe";
            authRoleBadge.style.color = "#1a73e8";
            toggleAdminInterfaceElements(false);
        }
        
        // Dynamic full responsive resize calculations
        structuralResponsiveResizeHandler();
    } else {
        // Fallback View Redirect to First Page Login Portal Form Frame
        loginPortalGate.style.display = 'flex';
        mainDashboardApplication.style.display = 'none';
        toggleAdminInterfaceElements(false);
    }
    
    // Clear Input Terminal Buffers safely
    document.getElementById('userLoginName').value = "";
    document.getElementById('userLoginPass').value = "";
    document.getElementById('adminLoginName').value = "";
    document.getElementById('adminLoginPass').value = "";
}

function toggleAdminInterfaceElements(show) {
    const cells = document.querySelectorAll('.admin-actions');
    cells.forEach(cell => {
        cell.style.display = show ? 'table-cell' : 'none';
    });
}

// ==========================================================================
// DIRECT HTML TABLE SNAPSHOT EXTRACTOR TO PDF 
// ==========================================================================
document.getElementById('btnExtractTablePDF').addEventListener('click', function () {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Khuangpuilam YMA Zualko Khawlkhawmna", 14, 15);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Extracted On: ${new Date().toLocaleString()}`, 14, 21);

    const recordCount = document.querySelectorAll("#tableBody tr").length;
    if (recordCount === 0) {
        alert("Extract tur data table-ah hian a awm lo.");
        return;
    }

    const currentAuthRole = sessionStorage.getItem('zualkoAuthRole');
    const isAdminModeActive = currentAuthRole === 'admin';

    doc.autoTable({
        html: '#dataTable',
        startY: 26,
        theme: 'grid',
        headStyles: { fillColor: [27, 61, 47], fontStyle: 'bold', halign: 'center' },
        styles: { fontSize: 10, verticalAlign: 'middle', minCellHeight: 32 },
        columnStyles: {
            0: { width: 35, halign: 'center' },
            1: { fontStyle: 'bold' }
        },
        columns: isAdminModeActive ? [0, 1, 2, 3, 4, 5, 6] : undefined,           
        
        didDrawCell: function (data) {
            if (data.section === 'body' && data.column.index === 0) {
                data.cell.text = [""];
                const rawImgElement = data.cell.raw.querySelector('img');
                
                if (rawImgElement && rawImgElement.src.startsWith('data:image')) {
                    const imgDataUrl = rawImgElement.src;
                    const size = 26;
                    const x = data.cell.x + (data.cell.width - size) / 2;
                    const y = data.cell.y + (data.cell.height - size) / 2;

                    let format = 'JPEG';
                    if (imgDataUrl.includes('image/png')) format = 'PNG';
                    if (imgDataUrl.includes('image/svg+xml')) format = 'SVG';

                    try {
                        doc.addImage(imgDataUrl, format, x, y, size, size);
                    } catch (err) {
                        console.error("Error parsing live table thumbnail to PDF: ", err);
                    }
                }
            }
        }
    });

    doc.save('Zualko_Khawlkhawmna.pdf');
});