PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE floors (
    floor_number INTEGER PRIMARY KEY,
    image_url TEXT
  , floor_name TEXT);
INSERT INTO floors VALUES(1,'/floors/floor1.png','קומה 1');
INSERT INTO floors VALUES(2,'\floors\floor2.png','קומה 2');
INSERT INTO floors VALUES(3,'\floors\floor3.png','קומה 3');
INSERT INTO floors VALUES(4,'\floors\floor4.png','קומה 4');
CREATE TABLE rooms (
    room_id TEXT PRIMARY KEY,
    room_name TEXT,
    room_number TEXT,
    floor INTEGER,
    x REAL,
    y REAL,
    FOREIGN KEY (floor) REFERENCES floors(floor_number)
  );
INSERT INTO rooms VALUES('1','Conference A','118',1,24.2160278745644603,27.6621787025703795);
INSERT INTO rooms VALUES('2','Kitchen','102',1,74.6581696825131046,18.0697424898748941);
INSERT INTO rooms VALUES('3','Conference B','201',2,35.6534090909090863,37.1975806451612882);
INSERT INTO rooms VALUES('4','Lounge','202',2,75.1420454545454532,68.4475806451612811);
INSERT INTO rooms VALUES('5','IT','301',3,50.6510489479165215,78.3518112850891554);
INSERT INTO rooms VALUES('88a179ae-a3c7-4eca-85e6-b55307c41020','מעבדת אלק','544',1,66.9780268659371955,77.2000000000000028);
INSERT INTO rooms VALUES('c1d59964-4197-46fb-b10e-08c2c88e8b5f','קרקעיות','546',1,67.9269341399045174,95.0);
INSERT INTO rooms VALUES('b7f53125-9fba-4025-ae78-42e039cb31e8','מעבדת קרקעיות','542',1,94.6861192657829917,89.2000000000000028);
INSERT INTO rooms VALUES('021a9205-fc8d-4e51-9f2b-00fba9d48c8e','Conference A','418',4,24.680603948896632,27.0501835985312126);
INSERT INTO rooms VALUES('98a676ac-d4fe-4005-a19b-1b77b162d858','Kitchen','402',4,74.5063879210220676,17.0134638922888612);
INSERT INTO rooms VALUES('cd2516aa-3938-43d8-9fee-ae4d1fb8c23f','מעבדת אלק','444',4,67.4216027874564503,77.1113831089351293);
INSERT INTO rooms VALUES('8dfc6797-e1ea-472f-9eac-82a252cd5572','קרקעיות','446',4,66.9570267131242786,94.2472460220318311);
INSERT INTO rooms VALUES('e3d8e713-162a-4237-a466-3ea65d910007','מעבדת קרקעיות','442',4,95.2961672473867622,89.9632802937576485);
INSERT INTO rooms VALUES('5a0ee557-d04f-486b-9b2e-2a866c0e36d8','AA','101',1,79.7328687572589984,17.5030599755201947);
INSERT INTO rooms VALUES('0091289e-9610-4531-9a2c-a8f609135eca','BB','100',1,85.0754936120789721,18.3598531211750284);
CREATE TABLE employees (
    id TEXT PRIMARY KEY,
    name TEXT,
    role TEXT,
    department TEXT,
    room_id TEXT,
    floor INTEGER, is_admin INTEGER DEFAULT 0, admin_email TEXT, admin_password TEXT, name_en TEXT, department_en TEXT, email TEXT, phone_office TEXT, phone_mobile TEXT, administration TEXT, is_active INTEGER DEFAULT 1,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id),
    FOREIGN KEY (floor) REFERENCES floors(floor_number)
  );
INSERT INTO employees VALUES('1029','משה מליה','Engineer','קרקעיות','c1d59964-4197-46fb-b10e-08c2c88e8b5f',1,1,'m.malia017@gmail.com','03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4','Moshe Malia','R&D','m.malia017@gmail.com','03-5551234','054-4793334','קרקעיות',1);
INSERT INTO employees VALUES('2','בן כהן','Designer','Design','2',1,0,NULL,NULL,'Ben Cohen','Design','ben@example.com','03-5552345','052-7654321',NULL,1);
INSERT INTO employees VALUES('3','חן לוי','HR','Product','3',2,0,NULL,NULL,'Chen Levi','Product','chen@example.com','03-5553456','054-9876543',NULL,1);
INSERT INTO employees VALUES('4','דנה יוגב','HR','People','4',2,0,NULL,NULL,'Dana Yogev','People','dana@example.com','03-5554567','058-2468101',NULL,1);
INSERT INTO employees VALUES('564','נתנאל חפץ','Engineer','קרקעיות','c1d59964-4197-46fb-b10e-08c2c88e8b5f',1,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'קרקעיות',1);
INSERT INTO employees VALUES('620','אביעד ס','Engineer','כדורים גדולים','5a0ee557-d04f-486b-9b2e-2a866c0e36d8',1,0,NULL,NULL,'Aviad S',NULL,NULL,NULL,NULL,NULL,1);
INSERT INTO employees VALUES('1250','ישראל ישראלי','HR','People','98a676ac-d4fe-4005-a19b-1b77b162d858',4,0,NULL,NULL,'Israel Israel',NULL,NULL,NULL,NULL,NULL,1);
CREATE TABLE roles (
    name TEXT PRIMARY KEY
  );
INSERT INTO roles VALUES('Designer');
INSERT INTO roles VALUES('Engineer');
INSERT INTO roles VALUES('HR');
INSERT INTO roles VALUES('IT');
CREATE TABLE departments (
    name TEXT PRIMARY KEY
  );
INSERT INTO departments VALUES('Design');
INSERT INTO departments VALUES('People');
INSERT INTO departments VALUES('Product');
INSERT INTO departments VALUES('כדורים גדולים');
INSERT INTO departments VALUES('קרקעיות');
COMMIT;
