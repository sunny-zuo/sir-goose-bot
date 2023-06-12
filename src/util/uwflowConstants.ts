import { gql } from 'graphql-request';

export const uwflowQuery = gql`
    query getCourse($code: String) {
        course(where: { code: { _eq: $code } }) {
        ...CourseInfo
        ...CourseSchedule
        ...CourseRequirements
        ...CourseRating
        __typename
        }
    }
    fragment CourseInfo on course {
        id
        code
        name
        description
        profs_teaching {
        prof {
            id
            code
            name
            rating {
            liked
            comment_count
            __typename
            }
            __typename
        }
        __typename
        }
        __typename
    }
    fragment CourseSchedule on course {
        id
        sections {
        id
        enrollment_capacity
        enrollment_total
        class_number
        section_name
        term_id
        updated_at
        meetings {
            days
            start_date
            end_date
            start_seconds
            end_seconds
            location
            prof {
            id
            code
            name
            __typename
            }
            is_closed
            is_cancelled
            is_tba
            __typename
        }
        exams {
            date
            day
            end_seconds
            is_tba
            location
            section_id
            start_seconds
            __typename
        }
        __typename
        }
        __typename
    }
    fragment CourseRequirements on course {
        id
        antireqs
        prereqs
        coreqs
        postrequisites {
        postrequisite {
            id
            code
            name
            __typename
        }
        __typename
        }
        __typename
    }
    fragment CourseRating on course {
        id
        rating {
        liked
        easy
        useful
        filled_count
        comment_count
        __typename
        }
        __typename
    }  
`;
export const uwflowEndpoint = 'https://uwflow.com/graphql';
