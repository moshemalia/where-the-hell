BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS departments (
    name TEXT PRIMARY KEY
  );
CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    name TEXT,
    role TEXT,
    department TEXT,
    room_id TEXT,
    floor INTEGER, is_admin INTEGER DEFAULT 0, admin_email TEXT, admin_password TEXT, name_en TEXT, department_en TEXT, email TEXT, phone_office TEXT, phone_mobile TEXT, administration TEXT, is_active INTEGER DEFAULT 1,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id),
    FOREIGN KEY (floor) REFERENCES floors(floor_number)
  );
CREATE TABLE IF NOT EXISTS floors (
    floor_number INTEGER PRIMARY KEY,
    image_url TEXT
  , floor_name TEXT);
CREATE TABLE IF NOT EXISTS roles (
    name TEXT PRIMARY KEY
  );
CREATE TABLE IF NOT EXISTS rooms (
    room_id TEXT PRIMARY KEY,
    room_name TEXT,
    room_number TEXT,
    floor INTEGER,
    x REAL,
    y REAL,
    FOREIGN KEY (floor) REFERENCES floors(floor_number)
  );
INSERT INTO "departments" ("name") VALUES ('Design');
INSERT INTO "departments" ("name") VALUES ('People');
INSERT INTO "departments" ("name") VALUES ('Product');
INSERT INTO "departments" ("name") VALUES ('כדורים גדולים');
INSERT INTO "departments" ("name") VALUES ('קרקעיות');
INSERT INTO "employees" ("id","name","role","department","room_id","floor","is_admin","admin_email","admin_password","name_en","department_en","email","phone_office","phone_mobile","administration","is_active") VALUES ('1029','משה מליה','Engineer','קרקעיות','c1d59964-4197-46fb-b10e-08c2c88e8b5f',1,1,'m.malia017@gmail.com','03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4','Moshe Malia','R&D','m.malia017@gmail.com','03-5551234','054-4793334','קרקעיות',1);
INSERT INTO "employees" ("id","name","role","department","room_id","floor","is_admin","admin_email","admin_password","name_en","department_en","email","phone_office","phone_mobile","administration","is_active") VALUES ('2','בן כהן','Designer','Design','2',1,0,NULL,NULL,'Ben Cohen','Design','ben@example.com','03-5552345','052-7654321',NULL,1);
INSERT INTO "employees" ("id","name","role","department","room_id","floor","is_admin","admin_email","admin_password","name_en","department_en","email","phone_office","phone_mobile","administration","is_active") VALUES ('3','חן לוי','HR','Product','3',2,0,NULL,NULL,'Chen Levi','Product','chen@example.com','03-5553456','054-9876543',NULL,1);
INSERT INTO "employees" ("id","name","role","department","room_id","floor","is_admin","admin_email","admin_password","name_en","department_en","email","phone_office","phone_mobile","administration","is_active") VALUES ('4','דנה יוגב','HR','People','4',2,0,NULL,NULL,'Dana Yogev','People','dana@example.com','03-5554567','058-2468101',NULL,1);
INSERT INTO "employees" ("id","name","role","department","room_id","floor","is_admin","admin_email","admin_password","name_en","department_en","email","phone_office","phone_mobile","administration","is_active") VALUES ('564','נתנאל חפץ','Engineer','קרקעיות','c1d59964-4197-46fb-b10e-08c2c88e8b5f',1,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'קרקעיות',1);
INSERT INTO "employees" ("id","name","role","department","room_id","floor","is_admin","admin_email","admin_password","name_en","department_en","email","phone_office","phone_mobile","administration","is_active") VALUES ('620','אביעד ס','Engineer','כדורים גדולים','5a0ee557-d04f-486b-9b2e-2a866c0e36d8',1,0,NULL,NULL,'Aviad S',NULL,NULL,NULL,NULL,NULL,1);
INSERT INTO "employees" ("id","name","role","department","room_id","floor","is_admin","admin_email","admin_password","name_en","department_en","email","phone_office","phone_mobile","administration","is_active") VALUES ('1250','ישראל ישראלי','HR','People','98a676ac-d4fe-4005-a19b-1b77b162d858',4,0,NULL,NULL,'Israel Israel',NULL,NULL,NULL,NULL,NULL,1);
INSERT INTO "floors" ("floor_number","image_url","floor_name") VALUES (1,'/floors/floor1.png','קומה 1');
INSERT INTO "floors" ("floor_number","image_url","floor_name") VALUES (2,'\floors\floor2.png','קומה 2');
INSERT INTO "floors" ("floor_number","image_url","floor_name") VALUES (3,'\floors\floor3.png','קומה 3');
INSERT INTO "floors" ("floor_number","image_url","floor_name") VALUES (4,'\floors\floor4.png','קומה 4');
INSERT INTO "roles" ("name") VALUES ('Designer');
INSERT INTO "roles" ("name") VALUES ('Engineer');
INSERT INTO "roles" ("name") VALUES ('HR');
INSERT INTO "roles" ("name") VALUES ('IT');
INSERT INTO "rooms" ("room_id","room_name","room_number","floor","x","y") VALUES ('1','Conference A','118',1,24.2160278745645,27.6621787025704);
INSERT INTO "rooms" ("room_id","room_name","room_number","floor","x","y") VALUES ('2','Kitchen','102',1,74.6581696825131,18.0697424898749);
INSERT INTO "rooms" ("room_id","room_name","room_number","floor","x","y") VALUES ('3','Conference B','201',2,35.6534090909091,37.1975806451613);
INSERT INTO "rooms" ("room_id","room_name","room_number","floor","x","y") VALUES ('4','Lounge','202',2,75.1420454545455,68.4475806451613);
INSERT INTO "rooms" ("room_id","room_name","room_number","floor","x","y") VALUES ('5','IT','301',3,50.6510489479165,78.3518112850892);
INSERT INTO "rooms" ("room_id","room_name","room_number","floor","x","y") VALUES ('88a179ae-a3c7-4eca-85e6-b55307c41020','מעבדת אלק','544',1,66.9780268659372,77.2);
INSERT INTO "rooms" ("room_id","room_name","room_number","floor","x","y") VALUES ('c1d59964-4197-46fb-b10e-08c2c88e8b5f','קרקעיות','546',1,67.9269341399045,95.0);
INSERT INTO "rooms" ("room_id","room_name","room_number","floor","x","y") VALUES ('b7f53125-9fba-4025-ae78-42e039cb31e8','מעבדת קרקעיות','542',1,94.686119265783,89.2);
INSERT INTO "rooms" ("room_id","room_name","room_number","floor","x","y") VALUES ('021a9205-fc8d-4e51-9f2b-00fba9d48c8e','Conference A','418',4,24.6806039488966,27.0501835985312);
INSERT INTO "rooms" ("room_id","room_name","room_number","floor","x","y") VALUES ('98a676ac-d4fe-4005-a19b-1b77b162d858','Kitchen','402',4,74.5063879210221,17.0134638922889);
INSERT INTO "rooms" ("room_id","room_name","room_number","floor","x","y") VALUES ('cd2516aa-3938-43d8-9fee-ae4d1fb8c23f','מעבדת אלק','444',4,67.4216027874565,77.1113831089351);
INSERT INTO "rooms" ("room_id","room_name","room_number","floor","x","y") VALUES ('8dfc6797-e1ea-472f-9eac-82a252cd5572','קרקעיות','446',4,66.9570267131243,94.2472460220318);
INSERT INTO "rooms" ("room_id","room_name","room_number","floor","x","y") VALUES ('e3d8e713-162a-4237-a466-3ea65d910007','מעבדת קרקעיות','442',4,95.2961672473868,89.9632802937576);
INSERT INTO "rooms" ("room_id","room_name","room_number","floor","x","y") VALUES ('5a0ee557-d04f-486b-9b2e-2a866c0e36d8','AA','101',1,79.732868757259,17.5030599755202);
INSERT INTO "rooms" ("room_id","room_name","room_number","floor","x","y") VALUES ('0091289e-9610-4531-9a2c-a8f609135eca','BB','100',1,85.075493612079,18.359853121175);
COMMIT;
