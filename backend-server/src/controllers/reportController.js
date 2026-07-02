const pool = require('../config/db');

const getReports = async (req, res) => {
    try {

        const result = await pool.query(`
            SELECT
                report_id,
                report_month,
                before_consumption,
                after_consumption,
                savings_percentage,
                generated_by
            FROM energyreports
            ORDER BY report_month DESC
        `);

        res.json(result.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });
    }
};

const generateReport = async (req, res) => {

    try {

        const generatedBy = 1;

        const energyResult = await pool.query(`
            SELECT
                COALESCE(SUM(energy),0) AS total_energy
            FROM energy_data
        `);

        const afterConsumption =
            Number(
                energyResult.rows[0].total_energy
            );

        const beforeConsumption =
            afterConsumption * 1.4;

        const savingsPercentage =
            (
                (
                    beforeConsumption -
                    afterConsumption
                ) /
                beforeConsumption
            ) * 100;

        const insertResult =
            await pool.query(
                `
                INSERT INTO energyreports
                (
                    generated_by,
                    report_month,
                    before_consumption,
                    after_consumption,
                    savings_percentage
                )
                VALUES
                (
                    $1,
                    CURRENT_DATE,
                    $2,
                    $3,
                    $4
                )
                RETURNING *
                `,
                [
                    generatedBy,
                    beforeConsumption,
                    afterConsumption,
                    savingsPercentage
                ]
            );

        res.json({
            success: true,
            report: insertResult.rows[0]
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }
};

module.exports = {
    getReports,
    generateReport
};