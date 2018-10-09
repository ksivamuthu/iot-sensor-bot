import { IEntity, WaterfallDialog, EntityRecognizer, Prompts, Message, CardAction, SuggestedActions } from "botbuilder";
import { SensorService } from '../services/sensor-service';
import * as moment from 'moment';
import * as _ from 'lodash';

const dialog = new WaterfallDialog([
    async (session, args, next) => {    

        const entities: IEntity[] = args.intent.entities;
        const aggregationEntities = EntityRecognizer.findAllEntities(entities, 'Aggregations');
        const sensorTypeEntity = EntityRecognizer.findEntity(entities, 'Sensor');
        
        if(sensorTypeEntity) 
        {   
            session.privateConversationData.sensorType = sensorTypeEntity.entity; 
        }

        if(aggregationEntities && aggregationEntities.length > 0) 
        {               
            session.privateConversationData.aggregationTypes = _.map(aggregationEntities, x => x.entity);
        }

        session.beginDialog('SensorTypeDialog');
    }, 
    async(session, results, next) => {
        const sensorType = session.privateConversationData.sensorType || 'temperature';
        const aggregationTypes = session.privateConversationData.aggregationTypes;

        if(sensorType && aggregationTypes) {
            const data = await SensorService.getTemperature(aggregationTypes);

            if(data) {                
                const msg = _.map(aggregationTypes, (aggregationType, i) => {
                    const result = data[aggregationType][0];
                    if(aggregationType == 'average') 
                    {
                        return `The ${aggregationType} ${sensorType} recorded in IoT device is ${parseFloat(result).toFixed(2)}` +
                        ` celsius degrees.`;
    
                    } else {
                        return `The ${aggregationType} ${sensorType} recorded in IoT device ${result.connectiondeviceid} is ${parseFloat(result.temperature).toFixed(2)}` +
                        ` celsius degrees. This was recorded on ${moment.unix(result._ts).local().format('LLLL')}`;
                    }   
                });

                session.endConversation(msg.join(', '));         
            }
        } else {
            session.endDialog();
        }
    }
]);

const aggregationDialog = new WaterfallDialog([
    async (session, args, next) => {
        let sensorType = session.privateConversationData.sensorType;
        let aggregationTypes = session.privateConversationData.aggregationTypes;
        if(!aggregationTypes) {            
            const msg = `What do you want to know on ${sensorType}?`
            const actions = [
                CardAction.imBack(session, 'Minimum', 'Minimum'),
                CardAction.imBack(session, 'Maximum', 'Maximum'),
                CardAction.imBack(session, 'Latest', 'Latest'),
                CardAction.imBack(session, 'Average', 'Average'),
            ];

            Prompts.choice(session, new Message(session)
                .text(msg)
                .suggestedActions(SuggestedActions.create(session, actions)), 
                ['Minimum', 'Maximum', 'Latest', 'Average']);
        } else {
            session.endDialogWithResult({response: {aggregation: true}});
        }
    }, 
    async(session, results, next) => {
        if(results.response && results.response.entity) {
            session.privateConversationData.aggregationTypes = [results.response.entity];
            session.endDialogWithResult({response: {aggregation: true}});
        }
    }
]);

const sensorTypeDialog = new WaterfallDialog([
    async (session, args, next) => {
        let sensorType = session.privateConversationData.sensorType; 
        if(!sensorType) {
            session.privateConversationData.sensorType = 'temperature';
            session.endDialog('I understand, you want more IoT sensor info. I can provide you with temperature sensor info.');
            return;
        } else {
            session.beginDialog('AggregationDialog');
        }           
    }
]);

export { sensorTypeDialog as SensorTypeDialog, aggregationDialog as AggregationDialog, dialog as SensorDialog }