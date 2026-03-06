import { LEARNING_AREA_GRADES, getGradeLabel } from './grades';

describe('Learning area grade source of truth', () => {
  it('uses individual grade codes (no grouped labels)', () => {
    const values = LEARNING_AREA_GRADES.map((grade) => grade.value);

    expect(values).toContain('CRECHE');
    expect(values).toContain('PLAYGROUP');
    expect(values).toContain('RECEPTION');
    expect(values).toContain('TRANSITION');
    expect(values).toContain('PP1');
    expect(values).toContain('PP2');
    expect(values).toContain('GRADE_1');
    expect(values).toContain('GRADE_9');

    expect(values).not.toContain('Early Years');
    expect(values).not.toContain('Pre-Primary');
    expect(values).not.toContain('Lower Primary');
    expect(values).not.toContain('Upper Primary');
    expect(values).not.toContain('Junior School');
    expect(values).not.toContain('Senior School');
  });

  it('returns readable labels for grade codes', () => {
    expect(getGradeLabel('GRADE_1')).toBe('Grade 1');
    expect(getGradeLabel('TRANSITION')).toBe('Transition');
  });
});
