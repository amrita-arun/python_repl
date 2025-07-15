# ITP 115, Spring 2025
# Homework 10
# Name: Ceci Pham
# Email: cecipham@usc.edu
# Section: 31870
# Instructor: Rob Parke
# Description: manages a dict of birthdays with options to load, display, add, update, and save data

# define the displayChoices() function
# Function: displayChoices
# Parameter: None
# Return value: None
# This function displays the choices to the user.
def displayChoices():
    print("Birthday Dictionary")
    print("   P) Print the birthdays")
    print("   A) Add a birthday")
    print("   U) Update a birthday")
    print("   Q) Quit")

# define the loadBirthdays(filenameStr="birthdays.csv") function
# Function: loadBirthdays
# Parameter: filenameStr is a str with the name of the CSV file to read and has a
# default value of "birthdays.csv"
# Return value: a dictionary containing birthdays where the keys are names of
# people (strings) and the values are birthdays (strings)
# This function reads a CSV file, creates a dictionary, and returns the dictionary.
def loadBirthdays(filenameStr="birthdays.csv"):
    dateDict = {}
    file = open(filenameStr, "r")
    for line in file:
        line = line.strip()
        parts = line.split(", ")
        name = parts [0]
        birthday = ", ".join(parts[1:])
        dateDict[name] = birthday
    file.close()
    return dateDict

# define the printBirthdays(dateDict) function
# Function: printBirthdays
# Parameter: dateDict is a dictionary containing birthdays where the keys are
# names of people (strings) and the values are birthdays (strings)
# Return value: None
# This function displays the names of people in alphabetical order with each
# birthday on its own line.
def printBirthdays(dateDict):
    keys = list(dateDict.keys())
    keys.sort()
    for name in keys:
        print(name + " was born on " + dateDict[name])

# define the addBirthday(dateDict) function
# Function: addBirthday
# Parameter: dateDict is a dictionary containing birthdays where the keys are
# names of people (strings) and the values are birthdays (strings)
# Return value: None
# This function gets user input to add a person and their corresponding birthday
# to the dateDict parameter.
def addBirthday(dateDict):
    person = input("Enter a person: ").strip().title()
    if person in dateDict:
        print(person + " (" + dateDict[person] + ") is already in the dictionary")
    else:
        birthday = input("Enter their birthday: ").strip().title()
        dateDict[person] = birthday
        print(person + " (" + birthday + ") has been added to the dictionary")

# define the updateBirthday(dateDict) function
# Function: updateBirthday
# Parameter: dateDict is a dictionary containing birthdays where the keys are
# names of people (strings) and the values are birthdays (strings)
# Return value: None
# This function gets user input to update the birthday of a person in the dateDict
# parameter.
def updateBirthday(dateDict):
    person = input("Enter a person: ").strip().title()
    if person not in dateDict:
        print(person + " is not in the dictionary")
    else:
        birthday = input("Enter their birthday: ").strip().title()
        dateDict[person] = birthday
        print(person + "'s birthday has been updated to " + birthday)

# define the saveBirthdaysToFile(dateDict, filename) function
# Function: saveBirthdaysToFile
# Parameter: dateDict is a dictionary containing birthdays/people and filename is the file it is saved to
# Return value: None
# This function allows the user to save birthdays to a CSV file
def saveBirthdaysToFile(dateDict, filename):
    file = open(filename, "w")
    keys = list(dateDict.keys())
    keys.sort()
    for name in keys:
        print(name + ", " + dateDict[name], file=file, end="\n")
    file.close()
    print("Data written to the " + filename + " file.")

# define the main function
def main():
    birthdays = loadBirthdays()
    displayChoices()
    choice = input("Choice: ").strip().lower()

    while choice.lower() != "q":
        if choice == "p":
            printBirthdays(birthdays)
        elif choice == "a":
            addBirthday(birthdays)
        elif choice == "u":
            updateBirthday(birthdays)
        else:
            print("Invalid choice")

        displayChoices()
        choice = input("Choice: ").strip().lower()

    if choice.lower() == "q":
        filename = input("Enter a filename: ").strip()
        saveBirthdaysToFile(birthdays, filename)

main()
