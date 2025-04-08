document.addEventListener('DOMContentLoaded', () => {
    const studentForm = document.getElementById('student-form');
    const studentList = document.getElementById('student-list');
    const attendanceList = document.getElementById('attendance-list');
    const saveAttendanceButton = document.getElementById('save-attendance');
    const listForm = document.getElementById('list-form');
    const studentLists = document.getElementById('student-lists');
    const removeStudentButton = document.getElementById('remove-student');
    const removeStudentListButton = document.getElementById('remove-student-list');

    studentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const className = document.getElementById('class').value;
        const rollNumber = document.getElementById('roll_number').value;
        const selectedList = studentLists.value;

        try {
            const students = JSON.parse(localStorage.getItem(selectedList)) || [];
            students.push({ name, email, class: className, roll_number: rollNumber });
            localStorage.setItem(selectedList, JSON.stringify(students));

            // Update student list and attendance list
            updateStudentList();
            updateAttendanceList();
        } catch (error) {
            console.error('Error adding student:', error);
        }
    });

    listForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const listName = document.getElementById('list-name').value;

        try {
            const lists = JSON.parse(localStorage.getItem('studentLists')) || [];
            lists.push(listName);
            localStorage.setItem('studentLists', JSON.stringify(lists));
            updateStudentLists();
        } catch (error) {
            console.error('Error creating list:', error);
        }
    });

    studentLists.addEventListener('change', () => {
        updateStudentList();
    });

    removeStudentButton.addEventListener('click', function() {
        const selectedList = studentLists.value;
        if (!selectedList) {
            alert('Please select a student list first');
            return;
        }

        try {
            // Get current students from localStorage
            const students = JSON.parse(localStorage.getItem(selectedList)) || [];
            
            if (students.length === 0) {
                alert('No students to remove');
                return;
            }

            // Remove the last student from the array
            students.pop();

            // Save updated students array back to localStorage
            localStorage.setItem(selectedList, JSON.stringify(students));

            // Update both student list and attendance list UI
            updateStudentList();
            updateAttendanceList();

        } catch (error) {
            console.error('Error removing student:', error);
            alert('Error removing student');
        }
    });

    removeStudentListButton.addEventListener('click', () => {
        const selectedList = studentLists.value;
        if (selectedList) {
            // Remove the selected list from localStorage
            localStorage.removeItem(selectedList);

            // Remove the list from the studentLists array in localStorage
            const lists = JSON.parse(localStorage.getItem('studentLists')) || [];
            const updatedLists = lists.filter(list => list !== selectedList);
            localStorage.setItem('studentLists', JSON.stringify(updatedLists));

            // Update the dropdown and clear the student and attendance lists
            updateStudentLists();
            studentList.innerHTML = '';
            attendanceList.innerHTML = '';
        }
    });

    function updateStudentLists() {
        try {
            const lists = JSON.parse(localStorage.getItem('studentLists')) || [];
            studentLists.innerHTML = '';
            lists.forEach(list => {
                const option = document.createElement('option');
                option.value = list;
                option.textContent = list;
                studentLists.appendChild(option);
            });
        } catch (error) {
            console.error('Error updating student lists:', error);
        }
    }

    function updateStudentList() {
        try {
            const selectedList = studentLists.value;
            const students = JSON.parse(localStorage.getItem(selectedList)) || [];
            studentList.innerHTML = '';
            students.forEach(student => {
                const li = document.createElement('li');
                li.textContent = `${student.name} (${student.roll_number})`;
                studentList.appendChild(li);
            });

            // Update attendance list
            updateAttendanceList();
        } catch (error) {
            console.error('Error updating student list:', error);
        }
    }

    function updateAttendanceList() {
        try {
            const selectedList = studentLists.value;
            const students = JSON.parse(localStorage.getItem(selectedList)) || [];
            attendanceList.innerHTML = '';
            students.forEach(student => {
                const li = document.createElement('li');
                li.innerHTML = `
                    ${student.name} (${student.roll_number})
                    <select data-roll-number="${student.roll_number}">
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                    </select>
                `;
                attendanceList.appendChild(li);
            });
        } catch (error) {
            console.error('Error updating attendance list:', error);
        }
    }

    saveAttendanceButton.addEventListener('click', () => {
        const attendanceDate = document.getElementById('attendance-date').value;
        const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords')) || {};
        const attendance = {};

        document.querySelectorAll('#attendance-list select').forEach(select => {
            const rollNumber = select.getAttribute('data-roll-number');
            attendance[rollNumber] = select.value;
        });

        attendanceRecords[attendanceDate] = attendance;
        localStorage.setItem('attendanceRecords', JSON.stringify(attendanceRecords));
        alert('Attendance saved successfully!');
        updateAttendanceTable();
    });

    function updateAttendanceTable() {
        const attendanceTableBody = document.querySelector('#attendance-table tbody');
        attendanceTableBody.innerHTML = ''; // Clear existing rows

        const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords')) || {};
        for (const [date, records] of Object.entries(attendanceRecords)) {
            for (const [rollNumber, status] of Object.entries(records)) {
                const student = getStudentByRollNumber(rollNumber);
                if (student) {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${student.name}</td>
                        <td>${rollNumber}</td>
                        <td>${date}</td>
                        <td>${status}</td>
                    `;
                    attendanceTableBody.appendChild(row);
                }
            }
        }
    }

    document.getElementById('download-report').addEventListener('click', function() {
        const attendanceDate = document.getElementById('attendance-date').value;
        const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords')) || {};
        let csvContent = 'Date,Name,Roll Number,Status\n';

        if (attendanceRecords[attendanceDate]) {
            for (const [rollNumber, status] of Object.entries(attendanceRecords[attendanceDate])) {
                const student = getStudentByRollNumber(rollNumber);
                if (student) {
                    csvContent += `${attendanceDate},${student.name},${rollNumber},${status}\n`;
                }
            }
        } else {
            alert('No attendance records found for the selected date.');
            return;
        }

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'attendance_report.csv';
        a.click();
        URL.revokeObjectURL(url);
    });

    function getStudentByRollNumber(rollNumber) {
        const selectedList = studentLists.value;
        const students = JSON.parse(localStorage.getItem(selectedList)) || [];
        return students.find(student => student.roll_number === rollNumber);
    }

    // Initial load
    updateStudentLists();
    updateStudentList();
});
