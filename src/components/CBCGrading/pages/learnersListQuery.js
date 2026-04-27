export const buildLearnerQueryParams = ({
  page = 1,
  searchTerm = '',
  paginationLimit = 50,
  filterGrade = 'all',
  filterStatus = 'all',
  filterStream = 'all',
}) => {
  const params = {
    page,
    search: searchTerm,
    limit: paginationLimit,
  };

  if (filterGrade !== 'all') params.grade = String(filterGrade).trim();
  if (filterStatus !== 'all') params.status = filterStatus;
  if (filterStream !== 'all') params.stream = filterStream;

  return params;
};
