/**
 * OnBoardIQ - Dummy Data Seeder
 *
 * Run:
 *   npm install pg
 *   node .\backend\seed-employee-tasks.js
 *
 * Required environment variable:
 *   DATABASE_URL
 */
import dotenv from "dotenv";
import { Pool } from "pg";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), ".env") });

if (!process.env.DATABASE_URL) {
  console.error(
    "Missing DATABASE_URL environment variable. Set it to your PostgreSQL connection string in backend/.env.",
  );
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.SUPABASE_SSL === "false"
      ? false
      : { rejectUnauthorized: false },
});

// --------------------------------------------------
// 1. DUMMY EMPLOYEES
// --------------------------------------------------

const employees = [
  {
    name: "Aarav Sharma",
    email: "aarav.sharma@example.com",
    jobTitle: "Software Engineer",
  },
  {
    name: "Priya Patel",
    email: "priya.patel@example.com",
    jobTitle: "Frontend Developer",
  },
  {
    name: "Rohan Mehta",
    email: "rohan.mehta@example.com",
    jobTitle: "Backend Developer",
  },
  {
    name: "Ananya Desai",
    email: "ananya.desai@example.com",
    jobTitle: "QA Engineer",
  },
  {
    name: "Kabir Khan",
    email: "kabir.khan@example.com",
    jobTitle: "Product Designer",
  },
];

// --------------------------------------------------
// 2. DUMMY ONBOARDING TASKS
// --------------------------------------------------

const tasks = [
  {
    title: "Complete your employee profile",
    description:
      "Add your contact details, profile photo, and emergency contact information.",
    required: true,
    estimatedMinutes: 10,
  },
  {
    title: "Read the employee handbook",
    description:
      "Review company policies, working hours, leave rules, and workplace guidelines.",
    required: true,
    estimatedMinutes: 25,
  },
  {
    title: "Set up your work email",
    description:
      "Activate your company email account and configure it on your devices.",
    required: true,
    estimatedMinutes: 15,
  },
  {
    title: "Complete security awareness training",
    description:
      "Learn password security, phishing prevention, and data handling.",
    required: true,
    estimatedMinutes: 30,
  },
  {
    title: "Meet your reporting manager",
    description: "Schedule an introductory meeting with your manager.",
    required: true,
    estimatedMinutes: 30,
  },
  {
    title: "Explore the company knowledge base",
    description:
      "Familiarize yourself with internal documentation and resources.",
    required: false,
    estimatedMinutes: 20,
  },
  {
    title: "Set up your development environment",
    description: "Install the tools and applications required for your role.",
    required: true,
    estimatedMinutes: 45,
  },
  {
    title: "Attend the new joiner orientation",
    description: "Attend the onboarding session and learn about the company.",
    required: true,
    estimatedMinutes: 60,
  },
];

// --------------------------------------------------
// 3. HELPER FUNCTIONS
// --------------------------------------------------

function daysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

// --------------------------------------------------
// 4. MAIN SEED FUNCTION
// --------------------------------------------------

async function main() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    console.log("Starting OnBoardIQ database seeding...\n");

    // ----------------------------------------------
    // Get existing department
    // ----------------------------------------------

    const departmentResult = await client.query(
      `SELECT id
       FROM public.departments
       ORDER BY id
       LIMIT 1`,
    );

    const departmentId = departmentResult.rows[0]?.id ?? null;

    // ----------------------------------------------
    // Insert employees
    // ----------------------------------------------

    console.log("Creating employees...");

    const employeeIds = [];

    for (const employee of employees) {
      const result = await client.query(
        `INSERT INTO public.users
          (
            name,
            email,
            role,
            department_id,
            job_title,
            joining_date,
            is_active
          )
         VALUES (
            $1,
            $2,
            'EMPLOYEE',
            $3,
            $4,
            CURRENT_DATE,
            TRUE
         )
         ON CONFLICT (email)
         DO UPDATE SET
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            department_id = EXCLUDED.department_id,
            job_title = EXCLUDED.job_title,
            is_active = TRUE,
            updated_at = NOW()
         RETURNING id`,
        [employee.name, employee.email, departmentId, employee.jobTitle],
      );

      employeeIds.push(result.rows[0].id);

      console.log(`Employee added: ${employee.name}`);
    }

    // ----------------------------------------------
    // Insert onboarding tasks
    // ----------------------------------------------

    console.log("\nCreating onboarding tasks...");

    const taskIds = [];

    for (const task of tasks) {
      let result = await client.query(
        `SELECT id
         FROM public.onboarding_tasks
         WHERE title = $1
         ORDER BY created_at
         LIMIT 1`,
        [task.title],
      );

      if (result.rowCount === 0) {
        result = await client.query(
          `INSERT INTO public.onboarding_tasks
            (
              title,
              description,
              department_id,
              required,
              estimated_minutes,
              is_active
            )
           VALUES ($1, $2, NULL, $3, $4, TRUE)
           RETURNING id`,
          [task.title, task.description, task.required, task.estimatedMinutes],
        );
      }

      taskIds.push(result.rows[0].id);

      console.log(`Task added: ${task.title}`);
    }

    // ----------------------------------------------
    // Assign tasks to employees
    // ----------------------------------------------

    console.log("\nAssigning tasks to employees...");

    for (
      let employeeIndex = 0;
      employeeIndex < employeeIds.length;
      employeeIndex++
    ) {
      for (let taskIndex = 0; taskIndex < taskIds.length; taskIndex++) {
        let status = "NOT_STARTED";
        let completedAt = null;

        // Generate different statuses for dashboard testing

        if ((employeeIndex + taskIndex) % 7 === 0) {
          status = "COMPLETED";
          completedAt = new Date().toISOString();
        } else if ((employeeIndex + taskIndex) % 4 === 0) {
          status = "IN_PROGRESS";
        }

        const dueDate = daysFromNow(3 + ((employeeIndex + taskIndex) % 10));

        await client.query(
          `INSERT INTO public.employee_tasks
            (
              employee_id,
              task_id,
              status,
              due_date,
              completed_at
            )
           VALUES (
              $1,
              $2,
              $3::public.task_status,
              $4,
              $5
           )
           ON CONFLICT (employee_id, task_id)
           DO UPDATE SET
              status = EXCLUDED.status,
              due_date = EXCLUDED.due_date,
              completed_at = EXCLUDED.completed_at`,
          [
            employeeIds[employeeIndex],
            taskIds[taskIndex],
            status,
            dueDate,
            completedAt,
          ],
        );
      }

      console.log(`Tasks assigned to: ${employees[employeeIndex].name}`);
    }

    // ----------------------------------------------
    // Commit transaction
    // ----------------------------------------------

    await client.query("COMMIT");

    console.log("\n================================");
    console.log("ONBOARDIQ SEEDING COMPLETED!");
    console.log("================================");

    console.log(`Employees: ${employeeIds.length}`);
    console.log(`Onboarding Tasks: ${taskIds.length}`);
    console.log(
      `Employee Task Assignments: ${employeeIds.length * taskIds.length}`,
    );
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("\nSeeding failed!");
    console.error(error);

    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

// --------------------------------------------------
// 5. EXECUTE
// --------------------------------------------------

main().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
