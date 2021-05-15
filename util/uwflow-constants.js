const { gql } = require("graphql-request");

const uwflowQuery = gql`
    query getCourse($code: String, $user_id: Int) {
        course(where: { code: { _eq: $code } }) {
            ...CourseInfo
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
const uwflowEndpoint = "https://uwflow.com/graphql";

module.exports = {
    uwflowEndpoint,
    uwflowQuery,
};
