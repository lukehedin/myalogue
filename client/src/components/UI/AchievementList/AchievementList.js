import React, { Component } from 'react';
import Util from '../../../Util';

import AchievementImage from './AchievementImage/AchievementImage';
import ProgressBar from '../ProgressBar/ProgressBar';

export default class AchievementList extends Component {
	render() {
		let lockedAchievements = [];
		let unlockedAchievements = [];

		Util.referenceData.getAchievements().forEach(achievement => {
			let userAchievement = this.props.userAchievements.find(userAchievement => userAchievement.type === achievement.type) || {};
			let withUserAchievement = {
				...achievement,
				...userAchievement
			};
			
			userAchievement && userAchievement.unlockedAt
				? unlockedAchievements.push(withUserAchievement)
				: lockedAchievements.push(withUserAchievement);
		});

		let getAchievementTable = (achievements) => <table className="achievement-table">
			<tbody>
				{achievements.map((achievement, idx) => {
					return <tr key={idx} className="achievement-row">
						<td className={`td-achievement-image ${achievement.unlockedAt ? 'unlocked' :''}`}>
							<AchievementImage achievementType={achievement.type} />
						</td>
						<td className="td-achievement-detail">
							<h4>{achievement.name}</h4>
							<p className="sm">{achievement.description}</p>
							{achievement.targetInt 
								? <ProgressBar amount={achievement.valueInt || 0} total={achievement.targetInt} label={`${(achievement.valueInt || 0)}/${(achievement.targetInt)}`} /> 
								: null
							}
						</td>
					</tr>
				})}
			</tbody>
		</table>;

		return <div className="achievement-list">
			<p className="page-subtitle">Unlocked achievements</p>
			{Util.array.any(unlockedAchievements)
				? getAchievementTable(unlockedAchievements)
				: <p className="empty-text">This user has no achievements.</p>
			}
			{Util.array.any(lockedAchievements)
				? <div>
					<hr />
					<p className="page-subtitle">Locked achievements</p>
					{getAchievementTable(lockedAchievements)}
				</div>
				: null
			}
		</div>;
	}
}