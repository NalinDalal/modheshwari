# Use-Cases

Database: PostgreSQL. 

Authentication: Implement OAuth2.0 or JWT for user authentication. 

Security: Hashing algorithms for IDS, HTTPS for data transmission, and role-based access control (RBAC). 

Caching: Redis

CI/CD pipelines: GitHub Actions

Monitoring and Logging: Prometheus, Grafana

Storage: AWS S3 Bucket 

Email Service: SendGrid 

Role-based access control (Admins, Members, etc.).

**User Profile Management**
- View and edit personal profile information.
- Update profile picture.
- Add, edit, and delete family details.

**User Sequence Diagram (User Registration)**
- API Gateway Data Validation Response Success/Fail BackEnd Secure storage of user data.

- Family and Member Management Manage individual member details within a Unique IDs for families and members (using hashing).

- Location-Based Rendering Filter and display families based on location (city, state).

**Event Management**
- View upcoming events.
- Register for events and make payments online. Download event passes with unique IDs.

**Notification System**
- Push notifications for important updates and reminders.
- Email notifications for event registrations and other alerts.

**Search Functionality**
- Search for families and members based on various criteria.
- Use Elasticsearch for fast and efficient searches. 


## Non Functional Requirements
- Provide multilingual support.
- Regular backups of data.


**Data Privacy and Security**
- Ensure sensitive data like Aadhar numbers are hidden. Secure communication using HTTPS.

**Access Control and Permissions**: 
- Fine-grained access control to manage who can view or edit specific information.
- Role-based permissions to ensure data security and privacy.

**Community Forums and Polls**:
- Create forums for discussions and idea exchanges among members. Conduct polls to gather opinions on community matters and decisions.

**User Experience Enhancement**
- Implement a step-by-step onboarding process for new users. Provide tooltips, guides, and FAQs to assist users in navigating the app.
- Regularly gather user feedback and make improvements based on their suggestions.
- The UI should be intuitive and easy to navigate.

**Security Requirements**
- Use OAuth2.0 or JWT for authentication. DataBase Encrypt sensitive data in storage and during transmission.

**Scalability Requirements**
The system should handle up to 10,000 concurrent users.

Efficiently manage increasing data volume. 

Integration with Govt. API for Verification (eg. Aadhar etc) Provides fast and efficient search capabilities for family members and events. 

**Documents:**
- WorkFlow Process Family Member Search start Storage AWS-S3 V Documents & Images Backup also User initiates a search from the frontend. API Gateway routes the search request to the Backend. 
- Backend queries ElasticSearch for relevant results. Search results are sent back to the frontend and displayed to the user. 

**Payment Gateway Stripe/ RazorPay/ BillDesk/ etc**

**Notifications Email/SMS**

**Event Registration:**
- User registers for an event via the frontend. 
- API Gateway routes the registration request to the Backend 
- Process the request; 
- interacts with the Payment Gateway; 
- store in DB. A confirmation notification is sent to the user via Email/SMS.

Head if gets changed then the privilegs must also be transferred

# Database (29.01-30.01)
well well, we are so done with dba,
seeded the whole databse with some data for each like something for each and
every field with some data
`npm run seed`-> to seed the database;note it will not delete existing data
`npx prisma studio` -> to open database in visual format

# Next Steps:
Start working on api endpoints like user auth, start with google and phone number
now add profile page and add authentication logic

## 30.01->
 install next-auth, clerk as need to have multiple login routes

## 03.02->
added auth routes, 
need to have now role based auth, do it with google oauth also, with database
4 roles-> admin, subadmin, family-head, family-member
need to add family via family-head, family-member can join family

i think it is also done

## 05.02->
landing page and ui initiated

what do next->
1. add for role based auth via oauth, jwt
since we have what no of users-> i think 4
Admin-> head of community{create by own}
SubAdmin-> sub-head of community, 
->Head of Sub-Community
->Family Head{part of sub-community}
->Family Member{normal user}

Gotra{create them, they are literally 10 i think}
their admin, subadmin totals to 20, create their own endpoints, seed into db
{like hardcode them}
do generalised for normal user, family admin, so that i would need to make
literally 2 types of accounts

uhh, added for oauth, needed to add client, go to for oauth client{just surf it
you will get there}
now from developers.google.com we configured oauth, and it points to `http://localhost:3000/authorised`

what we want to acheive, like add family-head signup via oauth, it generates a fresh
family-id and seed into db
now user signup with oauth and the family id and gets authorised


first priority->
create a sidebar to navigate like every service, but keep it in a burger
button{done 09.02.2025}

update env

see i want to do what->
- create a family-id if family-head signsup
- join a family  with a family id if a family-member signups

01:17 09.02.2025
what is done, done with normal-user auth via google oauth

Next Procedure to do:
call for all types of routes, like create family, join family for normal user,
gotra bhi partcularly seed kr lo

area wise rendering of families
message easily sabhi ko pahuch jye-> sort of notification

by defualt user login
make admin routes custom, keep oauth in them, then works with type of user
like user has 5 types, so different routes has diff user type via oauth

17.02.2025
updated ui
added for services like diff routes
updated contact, about page

# User Auth Logic
lic ki policy dena h
do it's data entry
take details, payment
policy no get's alloted-> system
no user power 

manually put a types.ts file with required user permission, for that make some permission, then import them into user, then handle with auth
like admin has all rights, but family admin doesn't, so handle the rendering of the components based on user role
well the thing is we also want like oauth but role based from types.ts file

Modheshwari auth

When a family head signs up
Make a form after that with all data to be put their

But when user sings up with family id, just ask for personal details like blood grp etc
Rest is put into db as per familyid like head of family, their surnames erc

Hmm the thing is i just need to have logic to authenticate user for now
How role based signup happens, their signin
After that just fetch api and render on client

Then see for other microservices

build this one : charge maybe once it's built {16000 INR}

05/04: removed clerk, get this shit sorted out today itself for role-based auth
need to sort various pages, also decide b/w custom jwt to use or oauth to use.
well we will use both
install dependencies-> `npm install next-auth @auth/core jsonwebtoken`

Create Auth Route Handler-> `/app/api/auth/[...nextauth]/route.ts`

update prisma files with new logic
removed clerk node_modules
updated seed.ts file

updated the whole schema->client migration-> `npx prisma migrate dev --name add-role-sub-to-user`
generation-> `npx prisma generate`
re run seed-> `npm run seed`
done with it,

now what to do:->
start writing the fe logic for a user, then will see for other things
fe logic contains-> contact, events etc things like that
