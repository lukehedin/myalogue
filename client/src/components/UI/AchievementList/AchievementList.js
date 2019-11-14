import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';

import AchievementImage from './AchievementImage/AchievementImage';
import ProgressBar from '../ProgressBar/ProgressBar';
import moment from 'moment';

//this.props.userAchievementInfo
export default class AchievementList extends Component {
	render() {
		let lockedAchievements = [];
		let unlockedAchievements = [];

		Util.referenceData.getAchievements().forEach(achievement => {
			achievement.userAchievement = this.props.userAchievementInfo.userAchievements.find(userAchievement => userAchievement.type === achievement.type);
			achievement.userAchievementProgress = this.props.userAchievementInfo.userAchievementProgress[achievement.type] || 0;
			
			achievement.userAchievement
				? unlockedAchievements.push(achievement)
				: lockedAchievements.push(achievement);
		});

		let getAchievementTable = (achievements) => <table className="achievement-table">
			<tbody>
				{achievements.map((achievement, idx) => {
					return <tr key={idx} className="achievement-row">
						<td className={`td-achievement-image ${achievement.userAchievement ? 'unlocked' :''}`}>
							<AchievementImage achievementType={achievement.type} />
						</td>
						<td className="td-achievement-detail">
							<h4>{achievement.name}</h4>
							<p className="sm">{achievement.description}</p>
							{achievement.targetValue 
								? <ProgressBar amount={achievement.userAchievementProgress || 0} total={achievement.targetValue} label={`${(achievement.userAchievementProgress || 0)}/${(achievement.targetValue)}`} /> 
								: null
							}
							{achievement.userAchievement
								? <p className="unlocked-info">Unlocked on {moment(achievement.userAchievement).format('DD/MM/YYYY')}{achievement.userAchievement.comicId ? <span> (<Link to={Util.route.comic(achievement.userAchievement.comicId)}>comic #{achievement.userAchievement.comicId}</Link>)</span> : null}</p>
								: null
							}
						</td>
					</tr>
				})}
			</tbody>
		</table>;

		return <div className="achievement-list">
			<h4 className="table-title">Unlocked achievements</h4>
			{Util.array.any(unlockedAchievements)
				? getAchievementTable(unlockedAchievements)
				: <p className="empty-text">This user has no achievements.</p>
			}
			{Util.array.any(lockedAchievements)
				? <div>
					<hr />
					<h4 className="table-title">Locked achievements</h4>
					{getAchievementTable(lockedAchievements)}
				</div>
				: null
			}
		</div>;
	}
}