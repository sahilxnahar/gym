# Health and training feature boundaries

Forge is a workout journal and exercise finder. These features offer general information; they do not diagnose, prescribe nutrition, or replace a qualified trainer or health professional.

## BMI calculator

- The optional calculator uses **weight in kilograms ÷ height in metres squared**. It accepts metric or imperial input and does not retain the measurements after showing a result. It does not upload them, include them in a backup, use them to change a plan, or set a target weight.
- The six labels follow common adult screening bands: below 18.5; 18.5–under 25; 25–under 30; 30–under 35; 35–under 40; and 40 or higher. The user must confirm that they are **20 or older** before seeing the adult category text.
- BMI is a screening measure, not a diagnosis. It does not distinguish fat from muscle or measure individual health. Interpretation may differ by population and personal circumstances; a health professional can help interpret an unexpected or concerning result.
- Forge does **not** calculate child/teen percentiles, pregnancy guidance, body-fat estimates, calorie targets or goal weights. People under 20 should not use adult cutoffs; people aged 2–19 use age- and sex-specific BMI-for-age percentiles.

## Training ages and plans

- The editable profile offers under 18, 18–39, 40–64, 65–74, and 75 or older. Under-18 users can journal workouts and browse exercises, but Forge pauses automatic plan generation; the product advises parent/guardian and qualified-coach support.
- Movement-limit notes are part of the training profile. If account sync is enabled, they are sent to that app owner's server; users are told not to enter private medical details.
- Profiles aged 65+ receive a conservative default of up to two lower-impact sessions per week and one set per movement. This is not an age-specific medical prescription. Every session remains editable, and limitations pause automatic suggestions for individual review.
- Users can select bodyweight, resistance bands, dumbbells and/or gym equipment; choose 1–7 available days and 15–90 minutes; focus a body area; and opt into or manually arrange supersets. Experience and available time cap automatically suggested session counts.
- Height and bodyweight are not used to choose exercise load. Each routine is a draft to review; stop for pain, dizziness or other unusual symptoms and seek appropriate guidance.

## Cardio and food reminders

- Cardio suggestions cover walking, cycling, swimming or water exercise, dance, rowing, seated movement, and steps/hills. The simple “talk test” wording is a general pacing cue, not a heart-rate prescription.
- Forge cites the CDC's adult guideline of 150 minutes of moderate aerobic activity per week plus muscle strengthening on two or more days as **general information**, not a personalized target. Any activity should be adapted to the person; comfortable movement is encouraged without making the guideline a pass/fail goal.
- Food preference and reminder fields are optional and stored under a separate browser-local key. They do not enter the workout journal, account sync or backup. Forge does not provide meal plans, calories, macros, medical diet guidance, or an allergy-safety guarantee. Users are told not to store sensitive clinical details in the note.

## Apple Health

Apple documents HealthKit as an Apple-platform capability configured through an iOS app and entitlements. A website/PWA cannot directly read the Apple Health database. A future integration would require a native iOS companion, explicit HealthKit permissions and a separate privacy review. Forge does not currently import health records.

## References

- [CDC: Adult BMI categories](https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html)
- [CDC: Adult BMI calculator and limitations](https://www.cdc.gov/bmi/adult-calculator/index.html)
- [CDC: BMI-for-age for children and teens](https://www.cdc.gov/bmi/child-teen-calculator/index.html)
- [CDC: Physical activity guidelines for adults](https://www.cdc.gov/physical-activity-basics/guidelines/adults.html)
- [CDC: Physical activity for older adults](https://www.cdc.gov/physical-activity-basics/guidelines/older-adults.html)
- [Apple: HealthKit overview](https://developer.apple.com/documentation/healthkit)
- [Apple: Configure HealthKit access](https://developer.apple.com/documentation/xcode/configuring-healthkit-access)
