SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL,ALLOW_INVALID_DATES';

DROP SCHEMA IF EXISTS `mydb` ;
CREATE SCHEMA IF NOT EXISTS `mydb` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci ;
USE `mydb` ;

-- -----------------------------------------------------
-- Table `mydb`.`Database`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `mydb`.`Database` ;

CREATE TABLE IF NOT EXISTS `mydb`.`Database` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(60) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`User`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `mydb`.`User` ;

CREATE TABLE IF NOT EXISTS `mydb`.`User` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NULL,
  `login` VARCHAR(60) NOT NULL,
  `password` VARCHAR(60) NOT NULL,
  `email` VARCHAR(60) NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`Profile`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `mydb`.`Profile` ;

CREATE TABLE IF NOT EXISTS `mydb`.`Profile` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(60) NOT NULL,
  `database_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_Profile_Database1_idx` (`database_id` ASC),
  INDEX `fk_Profile_User1_idx` (`user_id` ASC),
  CONSTRAINT `fk_Profile_Database1`
    FOREIGN KEY (`database_id`)
    REFERENCES `mydb`.`Database` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Profile_User1`
    FOREIGN KEY (`user_id`)
    REFERENCES `mydb`.`User` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`Data_Type`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `mydb`.`Data_Type` ;

CREATE TABLE IF NOT EXISTS `mydb`.`Data_Type` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(60) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`Image_Data`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `mydb`.`Image_Data` ;

CREATE TABLE IF NOT EXISTS `mydb`.`Image_Data` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `image_address` VARCHAR(250) NOT NULL,
  `description` BLOB NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`Text_Data`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `mydb`.`Text_Data` ;

CREATE TABLE IF NOT EXISTS `mydb`.`Text_Data` (
  `id` INT NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`Data`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `mydb`.`Data` ;

CREATE TABLE IF NOT EXISTS `mydb`.`Data` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `data_type_id` INT NOT NULL,
  `image_data_id` INT NOT NULL,
  `text_data_id` INT NOT NULL,
  `database_id` INT NOT NULL,
  `valid` BINARY NULL,
  `onevaluation` BINARY NULL,
  `trustworthiness` DECIMAL NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_Data_Data_Type1_idx` (`data_type_id` ASC),
  INDEX `fk_Data_Image_Data1_idx` (`image_data_id` ASC),
  INDEX `fk_Data_Text_Data1_idx` (`text_data_id` ASC),
  INDEX `fk_Data_DataBase1_idx` (`database_id` ASC),
  CONSTRAINT `fk_Data_Data_Type1`
    FOREIGN KEY (`data_type_id`)
    REFERENCES `mydb`.`Data_Type` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Data_Image_Data1`
    FOREIGN KEY (`image_data_id`)
    REFERENCES `mydb`.`Image_Data` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Data_Text_Data1`
    FOREIGN KEY (`text_data_id`)
    REFERENCES `mydb`.`Text_Data` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Data_DataBase1`
    FOREIGN KEY (`database_id`)
    REFERENCES `mydb`.`Database` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`Contribution`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `mydb`.`Contribution` ;

CREATE TABLE IF NOT EXISTS `mydb`.`Contribution` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `date` DATE NOT NULL,
  `user_id` INT NOT NULL,
  `trustworthiness` DECIMAL NULL,
  `data_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_Contribution_User1_idx` (`user_id` ASC),
  INDEX `fk_Contribution_Data1_idx` (`data_id` ASC),
  CONSTRAINT `fk_Contribution_User1`
    FOREIGN KEY (`user_id`)
    REFERENCES `mydb`.`User` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Contribution_Data1`
    FOREIGN KEY (`data_id`)
    REFERENCES `mydb`.`Data` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`Object`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `mydb`.`Object` ;

CREATE TABLE IF NOT EXISTS `mydb`.`Object` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(250) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`Attribute`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `mydb`.`Attribute` ;

CREATE TABLE IF NOT EXISTS `mydb`.`Attribute` (
  `id` INT NOT NULL,
  `name` VARCHAR(250) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`Relationship`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `mydb`.`Relationship` ;

CREATE TABLE IF NOT EXISTS `mydb`.`Relationship` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(250) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`Object_Relationship`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `mydb`.`Object_Relationship` ;

CREATE TABLE IF NOT EXISTS `mydb`.`Object_Relationship` (
  `object_subject_id` INT NOT NULL,
  `relationship_id` INT NOT NULL,
  `object_predicate_id` INT NOT NULL,
  `id` INT NOT NULL,
  INDEX `fk_Object_has_Relationship_Relationship1_idx` (`relationship_id` ASC),
  INDEX `fk_Object_has_Relationship_Object1_idx` (`object_subject_id` ASC),
  INDEX `fk_Object_has_Relationship_Object_Predicate_idx` (`object_predicate_id` ASC),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_Object_has_Relationship_Object_Subject`
    FOREIGN KEY (`object_subject_id`)
    REFERENCES `mydb`.`Object` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Object_has_Relationship_Relationship1`
    FOREIGN KEY (`relationship_id`)
    REFERENCES `mydb`.`Relationship` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Object_has_Relationship_Object_Predicate`
    FOREIGN KEY (`object_predicate_id`)
    REFERENCES `mydb`.`Object` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`Attribute_Type`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `mydb`.`Attribute_Type` ;

CREATE TABLE IF NOT EXISTS `mydb`.`Attribute_Type` (
  `id` INT NOT NULL,
  `name` VARCHAR(250) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`Object_Attribute`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `mydb`.`Object_Attribute` ;

CREATE TABLE IF NOT EXISTS `mydb`.`Object_Attribute` (
  `object_id` INT NOT NULL,
  `attribute_id` INT NOT NULL,
  `attribute_type_id` INT NOT NULL,
  `id` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_Object_has_Attribute_Attribute1_idx` (`attribute_id` ASC),
  INDEX `fk_Object_has_Attribute_Object1_idx` (`object_id` ASC),
  INDEX `fk_Object_Attribute_Attribute_Type1_idx` (`attribute_type_id` ASC),
  CONSTRAINT `fk_Object_has_Attribute_Object1`
    FOREIGN KEY (`object_id`)
    REFERENCES `mydb`.`Object` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Object_has_Attribute_Attribute1`
    FOREIGN KEY (`attribute_id`)
    REFERENCES `mydb`.`Attribute` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Object_Attribute_Attribute_Type1`
    FOREIGN KEY (`attribute_type_id`)
    REFERENCES `mydb`.`Attribute_Type` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`Image_Data_Object`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `mydb`.`Image_Data_Object` ;

CREATE TABLE IF NOT EXISTS `mydb`.`Image_Data_Object` (
  `image_data_id` INT NOT NULL,
  `object_id` INT NOT NULL,
  `position_x` INT NOT NULL,
  `position_y` INT NOT NULL,
  `id` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_Image_Data_has_Object_Object1_idx` (`object_id` ASC),
  INDEX `fk_Image_Data_has_Object_Image_Data1_idx` (`image_data_id` ASC),
  CONSTRAINT `fk_Image_Data_has_Object_Image_Data1`
    FOREIGN KEY (`image_data_id`)
    REFERENCES `mydb`.`Image_Data` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Image_Data_has_Object_Object1`
    FOREIGN KEY (`object_id`)
    REFERENCES `mydb`.`Object` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`Image_Data_Object_Object_Attribute`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `mydb`.`Image_Data_Object_Object_Attribute` ;

CREATE TABLE IF NOT EXISTS `mydb`.`Image_Data_Object_Object_Attribute` (
  `image_data_object_id` INT NOT NULL,
  `id` INT NOT NULL,
  `object_attribute_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_Image_Data_Object_Object_Attribute_Object_Attribute1_idx` (`object_attribute_id` ASC),
  INDEX `fk_Image_Data_has_Object_has_Object_Attribute_Image_Data_ha_idx` (`image_data_object_id` ASC),
  CONSTRAINT `fk_Image_Data_has_Object_has_Object_Attribute_Image_Data_has_1`
    FOREIGN KEY (`image_data_object_id`)
    REFERENCES `mydb`.`Image_Data_Object` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Image_Data_Object_Object_Attribute_Object_Attribute1`
    FOREIGN KEY (`object_attribute_id`)
    REFERENCES `mydb`.`Object_Attribute` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`Image_Data_Object_Object_Relationship`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `mydb`.`Image_Data_Object_Object_Relationship` ;

CREATE TABLE IF NOT EXISTS `mydb`.`Image_Data_Object_Object_Relationship` (
  `image_data_object_id` INT NOT NULL,
  `object_relationship_id` INT NOT NULL,
  `id` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_Image_Data_Object_has_Object_Relationship_Object_Relatio_idx` (`object_relationship_id` ASC),
  INDEX `fk_Image_Data_Object_has_Object_Relationship_Image_Data_Obj_idx` (`image_data_object_id` ASC),
  CONSTRAINT `fk_Image_Data_Object_has_Object_Relationship_Image_Data_Object1`
    FOREIGN KEY (`image_data_object_id`)
    REFERENCES `mydb`.`Image_Data_Object` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Image_Data_Object_has_Object_Relationship_Object_Relations1`
    FOREIGN KEY (`object_relationship_id`)
    REFERENCES `mydb`.`Object_Relationship` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
