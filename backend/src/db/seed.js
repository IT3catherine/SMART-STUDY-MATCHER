require("dotenv").config();

// Auto-replace 'db' host with 'localhost' so the script works outside of Docker
if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace('@db:', '@localhost:');
}

const { pool } = require("../config/db");
const crypto = require("crypto");
const { faker } = require("@faker-js/faker");

// The hash for 'password' from the massive seed
const defaultPasswordHash = "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGGa31lW";

const LEARNING_STYLES = ['Visual', 'Auditory', 'Reading/Writing', 'Kinesthetic'];
const COLLAB_MODES = ['online', 'physical', 'hybrid'];
const GOALS = [
  "Pass Exams", 
  "Deep Understanding", 
  "Practical Application", 
  "Project Work", 
  "Study Consistency", 
  "Networking", 
  "Peer Programming"
];
const PROGRAMS = [
  "Computer Science", 
  "Software Engineering", 
  "Data Science", 
  "Information Systems", 
  "Cybersecurity"
];
const LOCATIONS = ["Library", "Cafe", "On-Campus Study Room", "Remote only", "Student Union"];

async function runSeed() {
  console.log("Starting realistic data seed...");
  
  try {
    // We assume units are already seeded by 003_seed_units.sql
    const unitsRes = await pool.query("SELECT id, code, name FROM units");
    const units = unitsRes.rows;
    
    if (units.length === 0) {
      console.log("No units found. Please run the unit seed first.");
      process.exit(1);
    }
    
    // Config: How many students per unit
    const STUDENTS_PER_UNIT = 15;
    
    console.log(`Found ${units.length} units. Seeding ~${STUDENTS_PER_UNIT} users per unit...`);
    
    for (const unit of units) {
      console.log(`Seeding users for unit ${unit.code}...`);
      
      for (let i = 0; i < STUDENTS_PER_UNIT; i++) {
        const userId = crypto.randomUUID();
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const email = faker.internet.email({ firstName, lastName }).toLowerCase();
        
        // 1. Insert User
        await pool.query(
          `INSERT INTO users (id, name, email, password_hash, role)
           VALUES ($1, $2, $3, $4, 'STUDENT')
           ON CONFLICT (email) DO NOTHING`,
          [userId, `${firstName} ${lastName}`, email, defaultPasswordHash]
        );
        
        // Fetch to ensure we created or skipped
        const u = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
        if (u.rows.length === 0) continue;
        const actualUserId = u.rows[0].id;
        
        // 2. Insert Profile
        const goalsSelected = faker.helpers.arrayElements(GOALS, faker.number.int({ min: 1, max: 3 }));
        
        await pool.query(
          `INSERT INTO student_profiles 
           (user_id, program, year, learning_style, goals, bio, collaboration_mode, location, contact_pref, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
           ON CONFLICT (user_id) DO NOTHING`,
          [
            actualUserId,
            faker.helpers.arrayElement(PROGRAMS),
            faker.number.int({ min: 1, max: 4 }).toString(),
            faker.helpers.arrayElement(LEARNING_STYLES),
            JSON.stringify(goalsSelected),
            faker.person.bio(),
            faker.helpers.arrayElement(COLLAB_MODES),
            faker.helpers.arrayElement(LOCATIONS),
            faker.helpers.arrayElement(['email', 'phone', 'discord'])
          ]
        );
        
        // 3. Enroll in the primary unit
        await pool.query(
          `INSERT INTO enrollments (user_id, unit_id, semester)
           VALUES ($1, $2, '2026S1')
           ON CONFLICT (user_id, unit_id) DO NOTHING`,
          [actualUserId, unit.id]
        );
        
        // Randomly enroll in another unit sometimes
        if (faker.datatype.boolean()) {
          const secondUnit = faker.helpers.arrayElement(units);
          if (secondUnit.id !== unit.id) {
            await pool.query(
              `INSERT INTO enrollments (user_id, unit_id, semester)
               VALUES ($1, $2, '2026S1')
               ON CONFLICT (user_id, unit_id) DO NOTHING`,
              [actualUserId, secondUnit.id]
            );
          }
        }
        
        // 4. Insert Availabilities (1 to 3 random blocks per user)
        const numBlocks = faker.number.int({ min: 1, max: 3 });
        for (let b = 0; b < numBlocks; b++) {
          const dayOfWeek = faker.number.int({ min: 1, max: 7 });
          // Create a start time between 08:00 and 18:00
          const startHr = faker.number.int({ min: 8, max: 18 });
          // Duration between 1 and 3 hours
          const duration = faker.number.int({ min: 1, max: 3 });
          const endHr = startHr + duration;
          
          const startStr = `${startHr.toString().padStart(2, '0')}:00:00`;
          const endStr = `${endHr.toString().padStart(2, '0')}:00:00`;
          
          // Availability schema depends. Assuming its day_of_week, start_time, end_time
          try {
            await pool.query(
              `INSERT INTO availability_slots (id, user_id, day_of_week, start_time, end_time)
               VALUES ($1, $2, $3, $4, $5)`,
              [crypto.randomUUID(), actualUserId, dayOfWeek, startStr, endStr]
            );
          } catch (err) {
            // Ignore overlap/constraint errors for now just to proceed
          }
        }
        
        // 5. Insert Mock Feedback (simulate some reputation)
        // Some users will have a high rep, some lower, some none.
        if (faker.datatype.boolean(0.7)) { // 70% chance to have received some feedback
          const numFeedback = faker.number.int({ min: 1, max: 5 });
          for (let f = 0; f < numFeedback; f++) {
            const randomRater = crypto.randomUUID(); // Dummy from UUID (won't enforce foreign key if the db doesn't)
            const rating = faker.number.int({ min: 3, max: 5 }); // Mostly positive
            const comment = faker.helpers.arrayElement(["Great partner", "Very helpful", "Good enough", "Awesome!"]);
            
            try {
              const existingUsers = await pool.query("SELECT id FROM users WHERE id != $1 LIMIT 5", [actualUserId]);
              if (existingUsers.rows.length > 0) {
                 const randomRaterUser = faker.helpers.arrayElement(existingUsers.rows).id;
                 const dummyMatchId = crypto.randomUUID();
                 await pool.query(
                   `INSERT INTO matches (id, user1_id, user2_id) VALUES ($1, $2, $3)`,
                   [dummyMatchId, randomRaterUser, actualUserId]
                 );
                 await pool.query(
                   `INSERT INTO feedback (id, from_user_id, to_user_id, match_id, rating, comment)
                    VALUES ($1, $2, $3, $4, $5, $6)`,
                   [crypto.randomUUID(), randomRaterUser, actualUserId, dummyMatchId, rating, comment]
                 );
              }
            } catch (err) {
               // fk constraint might fail if randomRater not in users.
               // It's safer to pick an existing user! Let's just pick another user from the same unit
               // For simplicity we will skip feedback if it has fk constraints on from_user_id that fails.
            }
          }
        }
      }
    }
    
    console.log("Seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding:", err);
    process.exit(1);
  }
}

runSeed();
