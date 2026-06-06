-- Chuan hoa trong so rubric vong 21 = 100%
UPDATE score_criteria SET weight = 30.000, sort_order = 1 WHERE round_id = 21 AND code = 'R1_01';
UPDATE score_criteria SET weight = 25.000, sort_order = 2 WHERE round_id = 21 AND code = 'R1_02';
UPDATE score_criteria SET weight = 20.000, sort_order = 3 WHERE round_id = 21 AND code = 'R1_03';
UPDATE score_criteria SET weight = 15.000, sort_order = 4 WHERE round_id = 21 AND code = 'R1_04';
UPDATE score_criteria SET weight = 10.000, sort_order = 5 WHERE round_id = 21 AND code = 'R1_05';
