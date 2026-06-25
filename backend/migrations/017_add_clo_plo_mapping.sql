-- Global CLO to PLO mapping used by course/CLO management routes.
CREATE TABLE IF NOT EXISTS clo_plo_mapping (
    clo_id INT NOT NULL,
    plo_id INT NOT NULL,
    PRIMARY KEY (clo_id, plo_id),
    INDEX idx_cpm_plo (plo_id),
    CONSTRAINT fk_cpm_clo FOREIGN KEY (clo_id) REFERENCES clos(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_cpm_plo FOREIGN KEY (plo_id) REFERENCES plos(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

