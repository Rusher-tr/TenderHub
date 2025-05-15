-- Create DATABASE Tenderlink;

use TenderLink;

-- CREATE TABLE User (
--   user_id INT PRIMARY KEY AUTO_INCREMENT,
--   username VARCHAR(50) UNIQUE NOT NULL,
--   password VARCHAR(255) NOT NULL, 
--   role ENUM('Admin', 'Buyer', 'Bidder', 'Evaluator') NOT NULL,
--   email VARCHAR(100) UNIQUE NOT NULL,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );
-- alter table User Change username name varchar(50) not null;
-- alter table user add contact_number varchar(15);


-- CREATE TABLE Organization (
--   organization_id INT PRIMARY KEY AUTO_INCREMENT,
--   user_id INT NOT NULL, -- Buyer's user_id (FK)
--   organization_name VARCHAR(100) NOT NULL,
--   contact_phone VARCHAR(20) NOT NULL,
--   address TEXT NOT NULL,
--   FOREIGN KEY (user_id) REFERENCES User(user_id)
-- );


-- CREATE TABLE Tender (
--   tender_id INT PRIMARY KEY AUTO_INCREMENT,
--   user_id INT NOT NULL, -- Buyer's user_id (FK)
--   title VARCHAR(200) NOT NULL,
--   description TEXT NOT NULL,
--   issue_date DATE NOT NULL,
--   deadline DATE NOT NULL,
--   amount DECIMAL(15,2) NOT NULL,
--   status ENUM('Draft', 'Pending Approval', 'Published', 'Archived') DEFAULT 'Draft',
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   FOREIGN KEY (user_id) REFERENCES User(user_id)
-- );


-- CREATE TABLE Bid (
--   bid_id INT PRIMARY KEY AUTO_INCREMENT,
--   tender_id INT NOT NULL, -- FK to Tender
--   bidder_id INT NOT NULL, -- Bidder's user_id (FK)
--   amount DECIMAL(15,2) NOT NULL,
--   submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   status ENUM('Submitted', 'Under Review', 'Accepted', 'Rejected') DEFAULT 'Submitted',
--   FOREIGN KEY (tender_id) REFERENCES Tender(tender_id),
--   FOREIGN KEY (bidder_id) REFERENCES User(user_id)
-- );
-- alter table Bid modify status ENUM('Submitted', 'Locked') DEFAULT 'Submitted';


-- CREATE TABLE Evaluation (
--   evaluation_id INT PRIMARY KEY AUTO_INCREMENT,
--   bid_id INT NOT NULL, -- FK to Bid
--   evaluator_id INT NOT NULL, -- Evaluator's user_id (FK)
--   score INT CHECK (score BETWEEN 0 AND 10),
--   comments TEXT,
--   evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   FOREIGN KEY (bid_id) REFERENCES Bid(bid_id),
--   FOREIGN KEY (evaluator_id) REFERENCES User(user_id)
-- );
-- alter table Evaluation drop column comments;

-- For Tender Documents
-- CREATE TABLE TenderDocument (
--   document_id INT PRIMARY KEY AUTO_INCREMENT,
--   tender_id INT NOT NULL,
--   document_type ENUM('Terms', 'Specifications', 'Other') NOT NULL,
--   file_url VARCHAR(255) NOT NULL, -- Path to encrypted file
--   uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   FOREIGN KEY (tender_id) REFERENCES Tender(tender_id)
-- );
-- alter table TenderDocument drop column document_type;


-- For Bid Documents
-- CREATE TABLE BidDocument (
--   document_id INT PRIMARY KEY AUTO_INCREMENT,
--   bid_id INT NOT NULL,
--   document_type ENUM('Proposal', 'Financial', 'Other') NOT NULL,
--   file_url VARCHAR(255) NOT NULL, -- Path to encrypted file
--   uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   FOREIGN KEY (bid_id) REFERENCES Bid(bid_id)
-- );
-- alter table BidDocument drop column document_type;



-- commit;
