// ruleset taken from the large Software Engineering server
export const bigSERules = [
    { roles: ['Alumn'], department: 'CUSTOM/SE', match: 'exact', yearMatch: 'upper', year: 2016 },
    { roles: ['Alumn', 'SE 2021'], department: 'CUSTOM/SE', match: 'exact', yearMatch: 'equal', year: 2016 },
    { roles: ['Alumn', 'SE 2022'], department: 'CUSTOM/SE', match: 'exact', yearMatch: 'equal', year: 2017 },
    { roles: ['Alumn', 'SE 2023'], department: 'CUSTOM/SE', match: 'exact', yearMatch: 'equal', year: 2018 },
    { roles: ['Alumn', 'SE 2024'], department: 'CUSTOM/SE', match: 'exact', yearMatch: 'equal', year: 2019 },
    { roles: ['SE', 'SE 2025'], department: 'CUSTOM/SE', match: 'exact', yearMatch: 'equal', year: 2020 },
    { roles: ['SE', 'SE 2026'], department: 'VPA/Software Engineering', match: 'exact', yearMatch: 'equal', year: 2021 },
    { roles: ['SE', 'SE 2027'], department: 'VPA/Software Engineering', match: 'exact', yearMatch: 'equal', year: 2022 },
    { roles: ['SE', 'SE 2028'], department: 'VPA/Software Engineering', match: 'exact', yearMatch: 'equal', year: 2023 },
    { roles: ['SE', 'SE 2029'], department: 'VPA/Software Engineering', match: 'exact', yearMatch: 'equal', year: 2024 },
    { roles: ['SE', 'SE 2030'], department: 'VPA/Software Engineering', match: 'exact', yearMatch: 'equal', year: 2025 },
    { roles: ['SE'], department: 'VPA/Software Engineering', match: 'exact', yearMatch: 'all' },
    { roles: ['Non-SE'], department: 'any', match: 'anything', yearMatch: 'all' },
];
