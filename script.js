/**
 * Course Schedule Optimizer
 * 
 * This application implements a greedy scheduling algorithm to generate optimal timetables
 * for educational institutions. It handles multiple constraints including room availability,
 * class duration, and special time blocks.
 */

/**
 * Course class represents an individual course to be scheduled.
 * Each course has properties including name, code, instructor, type (theory/lab),
 * floor, room, and scheduling status.
 */
class Course {
    /**
     * Create a new Course instance
     * @param {string} name - The full name of the course
     * @param {string} code - The course code (e.g., CS101)
     * @param {string} instructor - The name of the instructor teaching the course
     * @param {string} type - The type of course: 'theory' or 'lab'
     * @param {number} classesPerWeek - Number of times this course meets per week (1-5)
     * @param {boolean} consistentRoom - Whether to use the same room for all classes
     * @param {number|null} floor - Optional preferred floor (1-7)
     * @param {number|null} room - Optional preferred room (1-13)
     */
    constructor(name, code, instructor, type, classesPerWeek = 3, consistentRoom = true, floor = null, room = null) {
        this.name = name;
        this.code = code;
        this.instructor = instructor;
        this.type = type; // 'theory' or 'lab'
        this.classesPerWeek = classesPerWeek; // Number of classes per week (1-5)
        this.consistentRoom = consistentRoom; // Whether to use same room for all classes
        this.floor = floor;
        this.room = room;
        this.scheduled = false; // Indicates if the course has been scheduled
        this.scheduledSlots = []; // Array to store all scheduled time slots
        this.scheduledRooms = {}; // Object to track assigned rooms by day
    }

    /**
     * Get the duration of the course in time slots
     * Lab courses take 2 slots, theory courses take 1 slot
     * @return {number} Number of time slots required for this course
     */
    get duration() {
        return this.type === 'lab' ? 2 : 1;
    }

    /**
     * Get a formatted string representation of the room
     * Format: "floor-room" (e.g., "3-05" for floor 3, room 5)
     * @param {string} [day] - Optional day parameter, for day-specific room display
     * @return {string} Formatted room identifier or 'Not assigned'
     */
    roomDisplay(day = null) {
        // If specific day is requested and we have different rooms per day
        if (day && !this.consistentRoom && this.scheduledRooms[day]) {
            const roomInfo = this.scheduledRooms[day];
            return `${roomInfo.floor}-${roomInfo.room.toString().padStart(2, '0')}`;
        }
        
        // Default case - use the main room
        if (this.floor && this.room) {
            // Pad room number with leading zero if needed (e.g., 3-05 instead of 3-5)
            return `${this.floor}-${this.room.toString().padStart(2, '0')}`;
        }
        return 'Not assigned';
    }
    
    /**
     * Get a summary of all rooms used by this course
     * @return {string} Summary of rooms or 'Not scheduled'
     */
    get roomSummary() {
        if (!this.scheduled) {
            return 'Not scheduled';
        }
        
        if (this.consistentRoom) {
            return this.roomDisplay();
        } else {
            // Create a summary of different rooms used
            const rooms = Object.values(this.scheduledRooms);
            if (rooms.length === 0) {
                return 'No rooms assigned';
            }
            
            // Count occurrences of each room
            const roomCounts = {};
            rooms.forEach(roomInfo => {
                const roomId = `${roomInfo.floor}-${roomInfo.room.toString().padStart(2, '0')}`;
                roomCounts[roomId] = (roomCounts[roomId] || 0) + 1;
            });
            
            // Format the summary
            return Object.entries(roomCounts)
                .map(([roomId, count]) => `${roomId} (${count}x)`)
                .join(', ');
        }
    }
}

/**
 * Schedule class manages the overall timetable and scheduling process.
 * It contains the scheduling algorithms and handles UI updates.
 */
class Schedule {
    /**
     * Initialize a new Schedule instance with default parameters
     */
    constructor() {
        // All available time slots (starting times)
        this.timeSlots = [
            '8:00 AM', '8:55 AM', '9:50 AM', '10:45 AM', '11:40 AM', 
            '12:35 PM', '1:20 PM', '2:00 PM', '2:55 PM', '3:50 PM', 
            '4:45 PM', '5:40 PM', '6:35 PM'
        ];
        
        // User-friendly display format for time slots
        this.displayTimeSlots = [
            '8:00 - 8:50', '8:55 - 9:45', '9:50 - 10:40', '10:45 - 11:35', '11:40 - 12:30', 
            '12:35 - 1:15', '1:20 - 2:00', '2:00 - 2:50', '2:55 - 3:45', '3:50 - 4:40', 
            '4:45 - 5:35', '5:40 - 6:30', '6:35 - 7:20'
        ];
        
        // Available days for scheduling (excluding weekends)
        this.days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        
        // Array to store all courses
        this.courses = [];
        
        // Initialize the schedule grid (2D structure: day -> time -> course)
        this.grid = this.initializeGrid();
        
        // Initialize the room availability map (3D structure: floor -> room -> availability)
        this.rooms = this.initializeRooms();
    }

    /**
     * Initialize an empty schedule grid
     * Creates a 2D structure: day -> time -> course (initially null)
     * @return {Object} A nested object representing the empty schedule grid
     */
    initializeGrid() {
        const grid = {};
        // For each day, create an object to store each time slot
        this.days.forEach(day => {
            grid[day] = {};
            // Initialize each time slot to null (meaning it's available)
            this.timeSlots.forEach(time => {
                grid[day][time] = null;
            });
        });
        return grid;
    }

    /**
     * Initialize the room availability data structure
     * Creates a 3D structure: floor -> room -> availability boolean
     * @return {Object} A nested object representing room availability
     */
    initializeRooms() {
        const rooms = {};
        // For each floor (1-7)
        for (let floor = 1; floor <= 7; floor++) {
            rooms[floor] = {};
            // For each regular room (1-13)
            for (let room = 1; room <= 13; room++) {
                rooms[floor][room] = true; // Available
            }
            // Rooms 14 and 15 are reserved for teachers and not available for scheduling
            rooms[floor][14] = false;
            rooms[floor][15] = false;
        }
        return rooms;
    }

    /**
     * Add a course to the schedule
     * @param {Course} course - The course to add
     */
    addCourse(course) {
        this.courses.push(course);
        this.updateCourseList(); // Update the UI
        this.showNotification('Course added successfully!', 'success');
    }

    /**
     * Check if a time slot is available for scheduling
     * This is a key part of the scheduling algorithm that implements multiple constraints
     * 
     * @param {string} day - The day to check
     * @param {number} timeIndex - The index of the starting time slot
     * @param {number} duration - The number of consecutive slots needed
     * @return {boolean} True if all needed slots are available, false otherwise
     */
    isTimeSlotAvailable(day, timeIndex, duration) {
        // CONSTRAINT 1: Extra-mural hour check (1:20 PM - 2:00 PM)
        // No classes can start during or overlap with the extra-mural hour
        if (timeIndex === 6 || (timeIndex < 6 && timeIndex + duration > 6)) {
            return false;
        }

        // CONSTRAINT 2: Check that all consecutive slots are available
        for (let i = 0; i < duration; i++) {
            const currentTimeIndex = timeIndex + i;
            
            // CONSTRAINT 3: Don't schedule beyond the last available time slot
            if (currentTimeIndex >= this.timeSlots.length) {
                return false;
            }
            
            const currentTime = this.timeSlots[currentTimeIndex];
            
            // CONSTRAINT 4: Don't double-book a time slot
            if (this.grid[day][currentTime] !== null) {
                return false;
            }
        }
        return true;
    }

    /**
     * Find an available room to assign to a course
     * Uses a greedy approach to search for the first available room
     * 
     * @param {number|null} floor - Optional preferred floor
     * @param {Course} course - The course to find a room for
     * @param {string} day - The day for which we're finding a room
     * @return {Object|null} An object with floor and room, or null if no room is available
     */
    findAvailableRoom(floor = null, course = null, day = null) {
        // If course prefers consistent room and already has room assignments, try to use the same room
        if (course && course.consistentRoom && Object.keys(course.scheduledRooms).length > 0) {
            // Get the first assigned room and try to use it
            const firstRoom = Object.values(course.scheduledRooms)[0];
            
            if (this.rooms[firstRoom.floor][firstRoom.room]) {
                return firstRoom;
            }
        }

        // STRATEGY 1: If a specific floor is requested, try to find a room on that floor first
        if (floor) {
            for (let room = 1; room <= 13; room++) {
                if (this.rooms[floor][room]) {
                    return { floor, room };
                }
            }
            return null; // No available rooms on the requested floor
        }

        // STRATEGY 2: If no specific floor or no rooms on preferred floor, find any available room
        // This is a greedy approach searching floors from bottom to top
        for (let floor = 1; floor <= 7; floor++) {
            for (let room = 1; room <= 13; room++) {
                if (this.rooms[floor][room]) {
                    return { floor, room };
                }
            }
        }
        return null; // No available rooms in the entire building
    }

    /**
     * Find available time slots for a course that needs multiple classes per week
     * Uses a distribution strategy to spread the classes across the week
     * 
     * @param {Course} course - The course to find time slots for
     * @param {number} count - Number of classes needed
     * @return {Array} Array of available day/time combinations
     */
    findAvailableTimeSlots(course, count) {
        const availableSlots = [];
        const duration = course.duration;
        
        // Calculate ideal spacing between classes
        const idealGap = Math.floor(this.days.length / count);
        
        // Preferred days for evenly distributed classes
        const preferredDays = [];
        for (let i = 0; i < count; i++) {
            const dayIndex = (i * idealGap) % this.days.length;
            preferredDays.push(this.days[dayIndex]);
        }
        
        // First try preferred days for better distribution
        for (const day of preferredDays) {
            if (availableSlots.length >= count) break;
            
            // Search all time slots on this day
            for (let i = 0; i < this.timeSlots.length; i++) {
                if (this.isTimeSlotAvailable(day, i, duration)) {
                    availableSlots.push({
                        day,
                        timeSlot: this.timeSlots[i],
                        timeIndex: i
                    });
                    break; // Found a slot for this day
                }
            }
        }
        
        // If we still need more slots, search the remaining days
        if (availableSlots.length < count) {
            // Get days we haven't checked yet
            const remainingDays = this.days.filter(day => !preferredDays.includes(day));
            
            for (const day of remainingDays) {
                if (availableSlots.length >= count) break;
                
                // Search all time slots on this day
                for (let i = 0; i < this.timeSlots.length; i++) {
                    if (this.isTimeSlotAvailable(day, i, duration)) {
                        availableSlots.push({
                            day,
                            timeSlot: this.timeSlots[i],
                            timeIndex: i
                        });
                        break; // Found a slot for this day
                    }
                }
            }
        }
        
        // If we still don't have enough slots, try additional time slots on days we already have
        if (availableSlots.length < count) {
            // Get days we've already scheduled at least one class
            const usedDays = availableSlots.map(slot => slot.day);
            
            for (const day of usedDays) {
                if (availableSlots.length >= count) break;
                
                // Find slots we haven't checked on this day (skip the one we already used)
                const usedTimeIndex = availableSlots.find(slot => slot.day === day).timeIndex;
                
                // Check time slots after the one we already used
                for (let i = usedTimeIndex + duration; i < this.timeSlots.length; i++) {
                    if (availableSlots.length >= count) break;
                    
                    if (this.isTimeSlotAvailable(day, i, duration)) {
                        availableSlots.push({
                            day,
                            timeSlot: this.timeSlots[i],
                            timeIndex: i
                        });
                        break;
                    }
                }
            }
        }
        
        return availableSlots;
    }

    /**
     * Find the first available time slot for a course
     * Implements a greedy algorithm to find the earliest possible slot
     * 
     * @param {Course} course - The course to find a time slot for
     * @return {Object|null} An object with day, timeSlot and timeIndex, or null if no slot is available
     */
    findAvailableTimeSlot(course) {
        // STRATEGY: Search all days and all time slots in order
        // This is a greedy approach prioritizing earlier days and times
        for (const day of this.days) {
            for (let i = 0; i < this.timeSlots.length; i++) {
                if (this.isTimeSlotAvailable(day, i, course.duration)) {
                    const timeSlot = this.timeSlots[i];
                    return { day, timeSlot, timeIndex: i };
                }
            }
        }
        return null; // No available time slot found
    }

    /**
     * Check if a specific room is available during a given time period
     * 
     * @param {number} floor - The floor number 
     * @param {number} room - The room number
     * @param {string} day - The day to check
     * @param {number} timeIndex - The index of the starting time slot
     * @param {number} duration - The number of consecutive slots needed
     * @return {boolean} True if the room is available for the entire period
     */
    isRoomAvailable(floor, room, day, timeIndex, duration) {
        for (let i = 0; i < duration; i++) {
            const currentTimeIndex = timeIndex + i;
            // Don't check beyond available time slots
            if (currentTimeIndex >= this.timeSlots.length) {
                return false;
            }
            
            const currentTime = this.timeSlots[currentTimeIndex];
            const courseInSlot = this.grid[day][currentTime];
            
            // Check if the room is already occupied at this time
            if (courseInSlot && courseInSlot.scheduledRooms[day] && 
                courseInSlot.scheduledRooms[day].floor === floor && 
                courseInSlot.scheduledRooms[day].room === room) {
                return false;
            }
        }
        return true; // Room is available for the entire duration
    }

    /**
     * Schedule a single class session for a course
     * 
     * @param {Course} course - The course to schedule
     * @param {Object} timeSlotInfo - The time slot information
     * @param {boolean} useConsistentRoom - Whether to try using the same room for all sessions
     * @return {boolean} True if successfully scheduled, false otherwise
     */
    scheduleClassSession(course, timeSlotInfo, useConsistentRoom) {
        const { day, timeSlot, timeIndex } = timeSlotInfo;
        
        // Handle room assignment
        let roomAssigned = false;
        let roomInfo = null;
        
        // Try to use consistent room if requested and previously assigned
        if (useConsistentRoom && course.consistentRoom && Object.keys(course.scheduledRooms).length > 0) {
            // Use the first assigned room
            roomInfo = Object.values(course.scheduledRooms)[0];
            
            // Check if the room is available at this time
            if (this.isRoomAvailable(roomInfo.floor, roomInfo.room, day, timeIndex, course.duration)) {
                roomAssigned = true;
            }
        }
        
        // Try to use preferred room if specified
        if (!roomAssigned && course.floor && course.room) {
            if (this.isRoomAvailable(course.floor, course.room, day, timeIndex, course.duration)) {
                roomInfo = { floor: course.floor, room: course.room };
                roomAssigned = true;
            }
        }
        
        // If no room assigned yet, find an available one
        if (!roomAssigned) {
            roomInfo = this.findAvailableRoom(course.floor, course, day);
            if (!roomInfo) {
                return false; // No available room found
            }
        }
        
        // Assign the course to all required time slots
        for (let i = 0; i < course.duration; i++) {
            const currentTimeIndex = timeIndex + i;
            const currentTime = this.timeSlots[currentTimeIndex];
            this.grid[day][currentTime] = course;
        }
        
        // Track this time slot in the course's scheduled slots
        course.scheduledSlots.push({ day, timeSlot, timeIndex });
        
        // Store the room assignment for this day
        course.scheduledRooms[day] = roomInfo;
        
        // If this is the first assignment and consistent room is requested, set as main room
        if (course.consistentRoom && !course.room) {
            course.floor = roomInfo.floor;
            course.room = roomInfo.room;
        }
        
        return true;
    }

    /**
     * Schedule a course using the greedy algorithm
     * This is the core function that places a course in the schedule
     * 
     * @param {Course} course - The course to schedule
     * @return {boolean} True if successfully scheduled, false otherwise
     */
    scheduleCourse(course) {
        // Determine how many class sessions we need to schedule
        const sessionsNeeded = course.classesPerWeek;
        
        // Find available time slots for all sessions
        const availableSlots = this.findAvailableTimeSlots(course, sessionsNeeded);
        
        // If we can't find enough slots, return false
        if (availableSlots.length < sessionsNeeded) {
            return false;
        }
        
        // Reset any previous scheduling data
        course.scheduledSlots = [];
        course.scheduledRooms = {};
        
        // Schedule each session
        let allScheduled = true;
        for (let i = 0; i < sessionsNeeded; i++) {
            const success = this.scheduleClassSession(
                course, 
                availableSlots[i], 
                i > 0 // Try consistent room after first session
            );
            
            if (!success) {
                allScheduled = false;
                break;
            }
        }
        
        // If all sessions were scheduled, mark course as scheduled
        if (allScheduled) {
            course.scheduled = true;
            return true;
        } else {
            // If any session failed, clean up partial schedules
            this.unscheduleCourse(course);
            return false;
        }
    }

    /**
     * Remove a course from all scheduled slots
     * 
     * @param {Course} course - The course to unschedule
     */
    unscheduleCourse(course) {
        // Remove from grid
        for (const day of this.days) {
            for (const time of this.timeSlots) {
                if (this.grid[day][time] === course) {
                    this.grid[day][time] = null;
                }
            }
        }
        
        // Reset course scheduling data
        course.scheduled = false;
        course.scheduledSlots = [];
        course.scheduledRooms = {};
    }

    /**
     * Generate an optimal schedule for all courses
     * Implements a greedy algorithm with a specific priority order
     */
    generateOptimalSchedule() {
        // Validate that we have courses to schedule
        if (this.courses.length === 0) {
            this.showNotification('Please add courses before generating a schedule!', 'warning');
            return;
        }

        // STEP 1: Reset the scheduling state
        this.rooms = this.initializeRooms();
        this.grid = this.initializeGrid();
        this.courses.forEach(course => {
            this.unscheduleCourse(course);
        });

        // STEP 2: Sort courses by priority
        // 1. Lab courses first (they need more time slots)
        // 2. Then by number of classes per week (more classes = harder to schedule)
        // 3. Finally by whether they need consistent rooms
        this.courses.sort((a, b) => {
            // First priority: Labs before theory
            if (a.type === 'lab' && b.type !== 'lab') return -1;
            if (a.type !== 'lab' && b.type === 'lab') return 1;
            
            // Second priority: More classes per week first
            if (a.classesPerWeek > b.classesPerWeek) return -1;
            if (a.classesPerWeek < b.classesPerWeek) return 1;
            
            // Third priority: Courses needing consistent rooms first
            if (a.consistentRoom && !b.consistentRoom) return -1;
            if (!a.consistentRoom && b.consistentRoom) return 1;
            
            return 0;
        });

        // STEP 3: Schedule each course using the greedy approach
        let scheduledCount = 0;
        let allScheduled = true;

        for (const course of this.courses) {
            const success = this.scheduleCourse(course);
            if (success) {
                scheduledCount++;
            } else {
                allScheduled = false;
            }
        }

        // STEP 4: Update the UI
        this.updateCourseList();

        // STEP 5: Notify user of results
        if (allScheduled) {
            this.showNotification(`All ${this.courses.length} courses scheduled successfully!`, 'success');
        } else {
            this.showNotification(`Scheduled ${scheduledCount} of ${this.courses.length} courses. Some could not be scheduled due to constraints.`, 'warning');
        }

        // STEP 6: Generate the visual timetable
        this.generateTimetable();
    }

    /**
     * Remove a course from the schedule
     * Also updates the UI and frees up resources
     * 
     * @param {number} index - The index of the course in the courses array
     */
    removeCourse(index) {
        const course = this.courses[index];
        
        // If the course was scheduled, free up its slots
        if (course.scheduled) {
            this.unscheduleCourse(course);
        }
        
        // Remove the course from the list
        this.courses.splice(index, 1);
        this.updateCourseList();
        this.showNotification('Course removed successfully!', 'success');
    }

    /**
     * Clear the entire schedule
     * Resets all data structures and updates the UI
     */
    clearSchedule() {
        this.courses = [];
        this.grid = this.initializeGrid();
        this.rooms = this.initializeRooms();
        this.updateCourseList();
        
        // Clear the timetable display
        const timetableContainer = document.getElementById('timetable');
        timetableContainer.innerHTML = '';
        
        this.showNotification('Schedule cleared!', 'success');
    }

    /**
     * Update the course list display in the UI
     * Creates a table showing all courses and their status
     */
    updateCourseList() {
        const courseListBody = document.querySelector('#courseList tbody');
        courseListBody.innerHTML = '';
        
        this.courses.forEach((course, index) => {
            const row = document.createElement('tr');
            
            // Name and code cell
            const nameCell = document.createElement('td');
            nameCell.innerHTML = `${course.name}<br><span class="course-code">${course.code}</span>`;
            
            // Instructor cell
            const instructorCell = document.createElement('td');
            instructorCell.textContent = course.instructor;
            
            // Type cell
            const typeCell = document.createElement('td');
            typeCell.textContent = course.type === 'theory' ? 'Theory' : 'Lab';
            
            // Classes per week cell
            const classesCell = document.createElement('td');
            classesCell.textContent = course.classesPerWeek;
            
            // Room assignment cell
            const roomCell = document.createElement('td');
            roomCell.textContent = course.scheduled ? course.roomSummary : 'Not scheduled';
            
            // Actions cell with remove button
            const actionsCell = document.createElement('td');
            const removeBtn = document.createElement('button');
            removeBtn.className = 'btn danger';
            removeBtn.textContent = 'Remove';
            removeBtn.addEventListener('click', () => this.removeCourse(index));
            actionsCell.appendChild(removeBtn);
            
            // Add all cells to row
            row.appendChild(nameCell);
            row.appendChild(instructorCell);
            row.appendChild(typeCell);
            row.appendChild(classesCell);
            row.appendChild(roomCell);
            row.appendChild(actionsCell);
            
            // Add row to table
            courseListBody.appendChild(row);
        });
    }

    /**
     * Generate the visual timetable display
     * Creates an HTML table showing the complete weekly schedule
     */
    generateTimetable() {
        const timetableContainer = document.getElementById('timetable');
        timetableContainer.innerHTML = '';
        
        // Create the main table element
        const table = document.createElement('table');
        table.className = 'timetable';
        
        // STEP 1: Create table header with days of the week
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        // Add time column header
        const timeHeader = document.createElement('th');
        timeHeader.className = 'time-header';
        timeHeader.textContent = 'Time / Day';
        headerRow.appendChild(timeHeader);
        
        // Add day column headers
        this.days.forEach(day => {
            const dayHeader = document.createElement('th');
            dayHeader.textContent = day;
            headerRow.appendChild(dayHeader);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // STEP 2: Create table body with time slots and courses
        const tbody = document.createElement('tbody');
        
        // For each time slot, create a row
        this.displayTimeSlots.forEach((displayTime, index) => {
            const row = document.createElement('tr');
            
            // Add time slot label
            const timeCell = document.createElement('td');
            timeCell.className = 'time-slot';
            timeCell.textContent = displayTime;
            row.appendChild(timeCell);
            
            // Special handling for extra-mural hour (1:20 - 2:00 PM)
            if (index === 6) { // 1:20 - 2:00 PM slot
                this.days.forEach(day => {
                    const extramuralCell = document.createElement('td');
                    extramuralCell.className = 'extramural';
                    extramuralCell.textContent = 'Extra-mural Hour';
                    row.appendChild(extramuralCell);
                });
            } else {
                // Regular time slot handling
                const time = this.timeSlots[index];
                
                // For each day, check if a course is scheduled
                this.days.forEach(day => {
                    const dayCell = document.createElement('td');
                    const course = this.grid[day][time];
                    
                    if (course) {
                        // IMPORTANT: Skip if this is a continuation of a multi-slot course
                        // This is how we handle lab courses that take 2 slots
                        if (index > 0 && this.grid[day][this.timeSlots[index - 1]] === course) {
                            return; // Skip adding a cell, as the previous cell has rowspan=2
                        }
                        
                        // Create the course display element
                        const courseCell = document.createElement('div');
                        courseCell.className = `course-cell ${course.type}`;
                        
                        // Add course code
                        const courseName = document.createElement('div');
                        courseName.className = 'course-name';
                        courseName.textContent = `${course.code}`;
                        
                        // Add instructor
                        const courseInstructor = document.createElement('div');
                        courseInstructor.className = 'course-instructor';
                        courseInstructor.textContent = course.instructor;
                        
                        // Add room - use day-specific room if different rooms per day
                        const courseRoom = document.createElement('div');
                        courseRoom.className = 'course-room';
                        courseRoom.textContent = course.roomDisplay(day);
                        
                        // Assemble the course display
                        courseCell.appendChild(courseName);
                        courseCell.appendChild(courseInstructor);
                        courseCell.appendChild(courseRoom);
                        
                        dayCell.appendChild(courseCell);
                        
                        // For lab courses, set rowspan=2 to span two time slots
                        if (course.type === 'lab') {
                            dayCell.rowSpan = 2;
                        }
                    }
                    
                    row.appendChild(dayCell);
                });
            }
            
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        timetableContainer.appendChild(table);
    }

    /**
     * Show a notification message to the user
     * Creates a temporary notification popup
     * 
     * @param {string} message - The message to display
     * @param {string} type - The type of notification (success, error, warning)
     */
    showNotification(message, type) {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type} show`;
        
        // Hide the notification after 3 seconds
        setTimeout(() => {
            notification.className = 'notification';
        }, 3000);
    }
}

// Initialize the schedule
const schedule = new Schedule();

/**
 * Set up event listeners when the DOM is fully loaded
 * This connects the UI elements to the scheduling functionality
 */
document.addEventListener('DOMContentLoaded', () => {
    const addCourseBtn = document.getElementById('addCourse');
    const generateScheduleBtn = document.getElementById('generateSchedule');
    const clearScheduleBtn = document.getElementById('clearSchedule');
    const floorSelect = document.getElementById('floor');
    const roomSelect = document.getElementById('room');
    const classTypeSelect = document.getElementById('classType');
    const classesPerWeekSelect = document.getElementById('classesPerWeek');
    const consistentRoomCheckbox = document.getElementById('consistentRoom');

    /**
     * Dynamic room selection handler
     * When a floor is selected, update the available rooms
     */
    floorSelect.addEventListener('change', () => {
        const floor = floorSelect.value;
        roomSelect.innerHTML = '<option value="">Auto-assign</option>';
        
        if (floor) {
            // Add regular rooms (1-13)
            for (let room = 1; room <= 13; room++) {
                const option = document.createElement('option');
                option.value = room;
                option.textContent = `Room ${room}`;
                roomSelect.appendChild(option);
            }
            
            // Add teacher rooms (14-15) as disabled options
            for (let room = 14; room <= 15; room++) {
                const option = document.createElement('option');
                option.value = room;
                option.textContent = `Room ${room} (Teacher Only)`;
                option.disabled = true;
                roomSelect.appendChild(option);
            }
        }
    });

    /**
     * Class type change handler
     * Adjust options based on class type selection
     */
    classTypeSelect.addEventListener('change', () => {
        const isLab = classTypeSelect.value === 'lab';
        
        // For lab classes, we typically have fewer sessions per week
        if (isLab) {
            // Update classes per week options for labs
            classesPerWeekSelect.innerHTML = '';
            for (let i = 1; i <= 3; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = `${i} class${i > 1 ? 'es' : ''} per week`;
                if (i === 1) option.selected = true;
                classesPerWeekSelect.appendChild(option);
            }
        } else {
            // Update classes per week options for theory
            classesPerWeekSelect.innerHTML = '';
            for (let i = 1; i <= 5; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = `${i} class${i > 1 ? 'es' : ''} per week`;
                if (i === 3) option.selected = true;
                classesPerWeekSelect.appendChild(option);
            }
        }
    });

    /**
     * Add course button handler
     * Validates input and creates a new course
     */
    addCourseBtn.addEventListener('click', () => {
        // Get form values
        const courseName = document.getElementById('courseName').value.trim();
        const courseCode = document.getElementById('courseCode').value.trim();
        const instructor = document.getElementById('instructor').value.trim();
        const classType = document.getElementById('classType').value;
        const classesPerWeek = parseInt(document.getElementById('classesPerWeek').value);
        const consistentRoom = document.getElementById('consistentRoom').checked;
        const floor = floorSelect.value ? parseInt(floorSelect.value) : null;
        const room = roomSelect.value ? parseInt(roomSelect.value) : null;

        // Validate required fields
        if (!courseName || !courseCode || !instructor) {
            schedule.showNotification('Please fill in all required fields!', 'error');
            return;
        }

        // Validate that teacher rooms (14 and 15) are not selected
        if (room && (room === 14 || room === 15)) {
            schedule.showNotification('Rooms 14 and 15 are reserved for teachers only!', 'error');
            return;
        }

        // Create and add the course
        const course = new Course(
            courseName, 
            courseCode, 
            instructor, 
            classType, 
            classesPerWeek,
            consistentRoom,
            floor, 
            room
        );
        schedule.addCourse(course);

        // Clear input fields
        document.getElementById('courseName').value = '';
        document.getElementById('courseCode').value = '';
        document.getElementById('instructor').value = '';
        document.getElementById('classType').value = 'theory';
        document.getElementById('classesPerWeek').value = '3';
        document.getElementById('consistentRoom').checked = true;
        document.getElementById('floor').value = '';
        document.getElementById('room').innerHTML = '<option value="">Auto-assign</option>';
    });

    /**
     * Generate schedule button handler
     * Triggers the scheduling algorithm
     */
    generateScheduleBtn.addEventListener('click', () => {
        schedule.generateOptimalSchedule();
    });

    /**
     * Clear schedule button handler
     * Adds confirmation before clearing
     */
    clearScheduleBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all courses and the schedule?')) {
            schedule.clearSchedule();
        }
    });
    
    // Initialize the class type dropdown to set correct classes per week options
    classTypeSelect.dispatchEvent(new Event('change'));
}); 
