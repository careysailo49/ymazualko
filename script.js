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
    loadTableData();
    checkAdminSession();
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

/* ==========================================================================
   DATA SUBMISSION MANAGEMENT LOGIC & LOCAL STORAGE SYNC
   ========================================================================== */
document.getElementById('btnSubmit').addEventListener('click', function() {
    const hming = document.getElementById('inHming').value.trim();
    if (!hming) {
        alert("Khawngaihin Hming ziak hmasa rawh.");
        return;
    }

    const defaultPlaceholder = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='%23ccc'/><text x='50' y='55' font-size='10' text-anchor='middle' fill='%23666'>No Photo</text></svg>";

    const itemRecord = {
        id: Date.now(),
        photo: currentPassportBase64 || defaultPlaceholder,
        hming: hming,
        kum: document.getElementById('inKum').value || 'N/A',
        chhungte: `${document.getElementById('inRelationType').value} ${document.getElementById('inSo').value}`,
        section: document.getElementById('inSection').value,
        thihni: formatCustomDate(document.getElementById('inThihNi').value),
        kohhran: document.getElementById('inKohhran').value || 'N/A'
    };

    let storageData = JSON.parse(localStorage.getItem('zualkoRecords')) || [];
    storageData.push(itemRecord);
    localStorage.setItem('zualkoRecords', JSON.stringify(storageData));

    currentPassportBase64 = "";
    document.getElementById('inHming').value = "";
    document.getElementById('inKum').value = "";
    document.getElementById('inSo').value = "";
    document.getElementById('inKohhran').value = "";
    document.getElementById('inPassport').value = "";
    document.getElementById('viewPassport').src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23ccc'/><text x='50' y='55' font-size='10' text-anchor='middle' fill='%23666'>No Photo (1:1 Ratio)</text></svg>";

    updatePoster();
    loadTableData();
});

function loadTableData() {
    const storageData = JSON.parse(localStorage.getItem('zualkoRecords')) || [];
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = "";

    const isAdmin = sessionStorage.getItem('adminAuthed') === 'true';

    storageData.forEach(item => {
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
                <button class="btn-delete" onclick="deleteRecord(${item.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    toggleAdminElements(isAdmin);
}

/* ==========================================================================
   AUTHENTICATION PROFILE SECURITY COMPONENT INTERFACES
   ========================================================================== */
document.getElementById('btnLogin').addEventListener('click', function() {
    const u = document.getElementById('adminUser').value;
    const p = document.getElementById('adminPass').value;

    if (u === 'kpladmin' && p === 'Mizoram@123') {
        sessionStorage.setItem('adminAuthed', 'true');
        checkAdminSession();
    } else {
        alert("Username emaw Password a dik lo.");
    }
});

document.getElementById('btnLogout').addEventListener('click', function() {
    sessionStorage.removeItem('adminAuthed');
    checkAdminSession();
});

function checkAdminSession() {
    const isAdmin = sessionStorage.getItem('adminAuthed') === 'true';
    if(isAdmin) {
        document.getElementById('adminLoginArea').style.display = 'none';
        document.getElementById('adminLogoutArea').style.display = 'block';
    } else {
        document.getElementById('adminLoginArea').style.display = 'block';
        document.getElementById('adminLogoutArea').style.display = 'none';
    }
    
    document.getElementById('adminUser').value = "";
    document.getElementById('adminPass').value = "";
    
    toggleAdminElements(isAdmin);
}

function toggleAdminElements(show) {
    const cells = document.querySelectorAll('.admin-actions');
    cells.forEach(cell => {
        cell.style.display = show ? 'table-cell' : 'none';
    });
}

window.deleteRecord = function(id) {
    if(confirm("He record hi i hlohtla duh chiang em?")) {
        let storageData = JSON.parse(localStorage.getItem('zualkoRecords')) || [];
        storageData = storageData.filter(item => item.id !== id);
        localStorage.setItem('zualkoRecords', JSON.stringify(storageData));
        loadTableData();
    }
};

/* ==========================================================================
   DIRECT HTML TABLE SNAPSHOT EXTRACTOR TO PDF (AS DISPLAYED ON SCREEN)
   ========================================================================== */
document.getElementById('btnExtractTablePDF').addEventListener('click', function () {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape setup

    // Document Titles
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Khuangpuilam YMA Zualko Khawlkhawmna List", 14, 15);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Extracted On: ${new Date().toLocaleString()}`, 14, 21);

    const recordCount = document.querySelectorAll("#tableBody tr").length;
    if (recordCount === 0) {
        alert("Extract tur data table-ah hian a awm lo.");
        return;
    }

    // Determine if Admin Mode column is currently visible on screen
    const isAdminModeActive = sessionStorage.getItem('adminAuthed') === 'true';

    // Parse the live HTML table directly into jsPDF matching screen appearance
    doc.autoTable({
        html: '#dataTable',
        startY: 26,
        theme: 'grid',
        headStyles: { fillColor: [27, 61, 47], fontStyle: 'bold', halign: 'center' }, // Theme dark green
        styles: { fontSize: 10, verticalAlign: 'middle', minCellHeight: 32 },
        columnStyles: {
            0: { width: 35, halign: 'center' }, // Fix Photo cell spacing bounds perfectly
            1: { fontStyle: 'bold' }
        },
        // Cut out the final Action/Delete button column if admin is logged in to match clean layout appearance
        columns: isAdminModeActive 
            ? [0, 1, 2, 3, 4, 5, 6] 
            : undefined,           
        
        didDrawCell: function (data) {
            // Find the first column cell block within the body container
            if (data.section === 'body' && data.column.index === 0) {
                // Clear the cell contents raw text string representation
                data.cell.text = [""];
                
                // Find the live img element embedded inside that specific table cell row
                const rawImgElement = data.cell.raw.querySelector('img');
                
                if (rawImgElement && rawImgElement.src.startsWith('data:image')) {
                    const imgDataUrl = rawImgElement.src;
                    const size = 26; // Match cell dimensions exactly (26mm box)
                    
                    // Math structure ensuring image remains perfectly centered inside the cell box boundaries
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

    doc.save('Zualko_Khawlkhawmna_List.pdf');
});